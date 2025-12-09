// app/lib/SessionProvider.tsx

"use client";

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  ReactNode,
  useMemo
} from 'react';
import { 
  useAccount, 
  useSignMessage, 
  useChainId, 
  useDisconnect, 
  useReadContract, 
  useWriteContract 
} from 'wagmi'; 
import { SiweMessage } from 'siwe';
import { resolveIpfsUrl } from './utils';

// --- ALAMAT & ABI KONTRAK ---
const USER_PROFILE_CONTRACT_ADDRESS = '0x8c09c8db25b81e5a9e1462f9bdc83dfcc7d7bf99';
const userProfileAbi = [
  {
    "inputs": [
      { "internalType": "string", "name": "_cid", "type": "string" }
    ],
    "name": "setProfileCID",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "getProfileCID",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "newCID", "type": "string" }
    ],
    "name": "ProfileUpdated",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "userProfileCIDs",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// --- Tipe Data ---
export interface ActivityItem { id: string; title: string; url: string; }
export interface Project {
  id: string; name: string; description: string;
  mediaPreview: string | null; tags: string[]; isFeatured: boolean;
  projectUrl: string; mediaIpfsUrl?: string | null; 
  pendingMediaFile?: File | null; 
}
export interface Profile {
  name: string; bio: string; github: string; animation: string;
  projects: Project[]; 
  activity: {
    blogPosts: ActivityItem[];
    certificates: ActivityItem[];
    contactEmail: string;
  };
  imageUrl?: string | null; readmeUrl?: string | null; readmeName?: string | null;
  pendingImageFile?: File | null; pendingReadmeFile?: File | null;
}
export interface AnimationExtension { id: string; name: string; }

// --- Tipe Konteks ---
interface SessionContextType {
  isAuthenticated: boolean;
  isLoading: boolean; // Loading sesi
  isProfileLoading: boolean; // Loading data profil
  profile: Profile | null; // Ini akan menjadi DRAF
  
  login: () => Promise<void>;
  logout: () => void;
  
  // Fungsi auto-save
  saveDraft: (dataToSave: Partial<Profile>) => void;
  
  // Status baru
  hasUnpublishedChanges: boolean;
  isPublishing: boolean;
  publishChangesToOnChain: () => Promise<void>;

  activeAnimation: string;
  setActiveAnimation: (anim: string) => Promise<void>;
  extensions: AnimationExtension[];
  addExtension: (url: string) => void;
  
  // Fungsi internal
  _setProfile: (profile: Profile | null) => void;
  _setIsProfileLoading: (loading: boolean) => void;
  isHydrated: boolean; // <--- Tambahkan ini ke tipe
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);
const IPFS_GATEWAY = 'https://ipfs.io';

const DEFAULTS = {
  animation: 'dino',
  extensions: [] as AnimationExtension[],
  defaultProfile: {
    name: '', bio: '', github: '', animation: 'dino',
    projects: [],
    activity: { blogPosts: [], certificates: [], contactEmail: '' },
  } as Profile
};

// --- KOMPONEN HELPER: PROFILE LOADER (LOGIKA DIPERBARUI) ---
const ProfileLoader = ({ children }: { children: ReactNode }) => {
  const { 
    _setProfile, 
    _setIsProfileLoading,
    isAuthenticated,
    isPublishing
  } = useAnimationStore();
  
  const { address } = useAccount();

  const { data: masterCID, isLoading: isReadingContract, isError, error: readContractError } = useReadContract({
    address: USER_PROFILE_CONTRACT_ADDRESS,
    abi: userProfileAbi,
    functionName: 'getProfileCID',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && isAuthenticated && !isPublishing,
    },
  });

  useEffect(() => {
    // Fungsi async di dalam useEffect
    const loadProfileData = async () => {
      _setIsProfileLoading(true);
      let onChainProfile: Profile | null = null;
      let loadedDraft: Profile | null = null;

      // --- STEP 1: Selalu coba ambil data ON-CHAIN (untuk perbandingan) ---
      if (masterCID) {
        try {
          console.log("Loading on-chain data (Direct IPFS)...");
          
          // --- PERUBAHAN DI SINI ---
          // URL diubah dari proxy lokal ke gateway publik
          const ipfsUrl = `${IPFS_GATEWAY}/ipfs/${masterCID}`;
          const res = await fetch(ipfsUrl); 
          // --- AKHIR PERUBAHAN ---

          if (res.ok) {
            onChainProfile = await res.json();
          } else {
             // Ubah pesan error agar lebih jelas
            throw new Error(`Direct IPFS fetch failed: status ${res.status}`);
          }
        } catch (e) {
          console.warn("Failed to fetch data from IPFS:", e);
        }
      }
      
      // Jika IPFS gagal, coba ambil dari Cache Server (Vercel KV)
      if (!onChainProfile) {
        try {
          console.log("IPFS failed, trying cache server (/api/user/profile)...");
          const res = await fetch('/api/user/profile');
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              onChainProfile = data.profile;
            }
          }
        } catch (e) {
          console.error("Failed to fetch data from cache server:", e);
        }
      }

      // Jika semua gagal, data on-chain dianggap default
      if (!onChainProfile) {
        console.log("No on-chain data found, using default.");
        onChainProfile = DEFAULTS.defaultProfile;
      }
      // SELALU simpan data on-chain untuk perbandingan
      (window as any).__onChainProfile = onChainProfile;

      // --- STEP 2: Tentukan apa yang harus ditampilkan di DRAF ---
      const localDraftJson = localStorage.getItem(`draftProfile_${address}`);
      if (localDraftJson) {
        console.log("Loading local draft from localStorage...");
        loadedDraft = JSON.parse(localDraftJson);
      } else {
        // Jika tidak ada draf lokal, gunakan data on-chain sebagai draf awal
        console.log("No local draft, using on-chain data as draft.");
        loadedDraft = onChainProfile;
      }

      // --- STEP 3: Atur State ---
      _setProfile(loadedDraft); // Set draf
      _setIsProfileLoading(false);
    };

    // --- Logika Eksekusi ---
    if (isAuthenticated && !isReadingContract && !isPublishing) {
      if (isError) {
        // Error saat baca contract, tidak bisa lanjut
        console.error("Failed to read smart contract:", readContractError);
        (window as any).__onChainProfile = DEFAULTS.defaultProfile; // Set default
        _setProfile(DEFAULTS.defaultProfile); // Set default
        _setIsProfileLoading(false);
      } else {
        // Panggil fungsi async
        loadProfileData();
      }
    } else if (!isAuthenticated) {
      // Jika tidak login, bersihkan semuanya
      _setProfile(null);
      _setIsProfileLoading(false);
      (window as any).__onChainProfile = undefined;
    }
  
  }, [
    isAuthenticated, 
    masterCID, 
    isReadingContract, 
    isError, 
    address, 
    _setProfile, 
    _setIsProfileLoading, 
    readContractError,
    isPublishing // Tambahkan isPublishing agar loader berjalan lagi setelah publikasi
  ]);

  return <>{children}</>;
};

// --- PROVIDER UTAMA ---
export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { address, chainId: wagmiChainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const chainId = wagmiChainId || 1;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
  // 'profile' sekarang adalah DRAF LOKAL
  const [profile, setProfile] = useState<Profile | null>(null); 
  
  const [extensions, setExtensions] = useState<AnimationExtension[]>(() => {
    if (typeof window === 'undefined') return DEFAULTS.extensions;
    return JSON.parse(localStorage.getItem('animation_extensions') || '[]');
  });

  const [isPublishing, setIsPublishing] = useState(false);
  const { writeContractAsync } = useWriteContract();

  // --- LOGIKA CEK SESI AWAL ---
  useEffect(() => {
    const checkSession = async () => {
      if (!address) {
        setIsAuthenticated(false);
        setProfile(null);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const res = await fetch('/api/user/profile');
        
        if (res.ok || res.status === 404) {
           setIsAuthenticated(true);
        } else {
           setIsAuthenticated(false);
           setProfile(null);
        }
      } catch (e) {
         setIsAuthenticated(false);
         setProfile(null);
      } finally {
        setIsLoading(false); 
      }
    };
    checkSession();
  }, [address]); 

  // --- Fungsi Login ---
  const login = useCallback(async () => {
    if (!address || !chainId) return;
    setIsLoading(true); 
    try {
      const nonceRes = await fetch('/api/siwe/nonce');
      const nonce = await nonceRes.text();
      const message = new SiweMessage({
        domain: window.location.host, address,
        statement: 'Sign in to Syafiq Dashboard',
        uri: window.location.origin, version: '1',
        chainId, nonce,
      });
      const signature = await signMessageAsync({ message: message.prepareMessage() });
      const verifyRes = await fetch('/api/siwe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.prepareMessage(), signature }),
      });
      if (!verifyRes.ok) throw new Error('Verification failed');
      
      setIsAuthenticated(true); 
      
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
      setProfile(null);
    } finally {
      setIsLoading(false); 
    }
  }, [address, chainId, signMessageAsync]);

  // --- Fungsi Logout ---
  const logout = useCallback(async () => {
    if (address) {
      localStorage.removeItem(`draftProfile_${address}`); // Hapus draf
    }
    setIsAuthenticated(false);
    setProfile(null); 
    try {
      await fetch('/api/siwe/logout'); 
    } catch (error) {
      console.error("Failed to clear session on server:", error);
    }
    disconnect();
  }, [disconnect, address]);

  // --- FUNGSI Simpan Draf (Auto-Save) ---
  const saveDraft = useCallback((dataToSave: Partial<Profile>) => {
    if (!isAuthenticated || !address) return;
    
    setProfile(prev => {
      const newDraft = { ...(prev as Profile), ...dataToSave };
      // Simpan ke localStorage secara otomatis
      localStorage.setItem(`draftProfile_${address}`, JSON.stringify(newDraft));
      return newDraft;
    });
  }, [isAuthenticated, address]);

  // --- Logika Animasi ---
  const setActiveAnimation = useCallback(async (newAnimation: string) => {
    saveDraft({ animation: newAnimation });
  }, [saveDraft]);
  const activeAnimation = profile?.animation || DEFAULTS.animation;

  // ... (Fungsi uploadFileToApi dan uploadJsonToApi tetap sama) ...
  const uploadFileToApi = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server error /api/upload:", errorText);
      throw new Error(`Failed to upload file (${response.status}). Server: ${errorText}`);
    }
    const data = await response.json();
    return data.ipfsHash;
  };
  
  const uploadJsonToApi = async (data: object): Promise<string> => {
    const response = await fetch('/api/upload-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server error /api/upload-json:", errorText);
      throw new Error(`Failed to upload JSON (${response.status}). Server: ${errorText}`);
    }
    const result = await response.json();
    return result.ipfsHash;
  };

  const publishChangesToOnChain = useCallback(async () => {
    if (!profile || !address) return alert("Profile has not been loaded.");
    
    setIsPublishing(true);
    let dataToUpload = JSON.parse(JSON.stringify(profile)); // Deep copy

    // --- FUNGSI HELPER BARU: Konversi data:url ke File ---
    const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File | null> => {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type });
      } catch (e) {
        console.error("Failed to convert data:url to file:", e);
        return null;
      }
    };
    
    try {
      // Upload Foto Profil (jika data:url)
      if (dataToUpload.imageUrl && dataToUpload.imageUrl.startsWith('data:')) {
        const file = await dataUrlToFile(dataToUpload.imageUrl, "profile-image");
        if(file) dataToUpload.imageUrl = `ipfs://${await uploadFileToApi(file)}`;
      }

      // Upload Readme (jika data:url)
      if (dataToUpload.readmeUrl && dataToUpload.readmeUrl.startsWith('data:')) {
        const file = await dataUrlToFile(dataToUpload.readmeUrl, dataToUpload.readmeName || "README.md");
        if(file) dataToUpload.readmeUrl = `ipfs://${await uploadFileToApi(file)}`;
      }

      // Upload Media Proyek (jika data:url)
      for (const project of dataToUpload.projects) {
        if (project.mediaPreview && project.mediaPreview.startsWith('data:')) {
          const file = await dataUrlToFile(project.mediaPreview, project.name || "project-media");
          if (file) {
            project.mediaIpfsUrl = `ipfs://${await uploadFileToApi(file)}`;
            project.mediaPreview = null; // Hapus data:url yang besar
          }
        }
      }
      
      // Hapus data 'pending' (jika ada) sebelum upload JSON
      delete dataToUpload.pendingImageFile;
      delete dataToUpload.pendingReadmeFile;
      for (const project of dataToUpload.projects) {
        delete project.pendingMediaFile;
      }
      
      // 2. Upload Master JSON
      const masterCID = await uploadJsonToApi(dataToUpload);
      console.log("Master CID didapat:", masterCID);

      // 3. Panggil Smart Contract
      await writeContractAsync({
        address: USER_PROFILE_CONTRACT_ADDRESS,
        abi: userProfileAbi,
        functionName: 'setProfileCID',
        args: [masterCID],
      });

      // 4. Vercel KV (Cache)
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUpload),
      });

      // 5. Perbarui state React & Hapus Draf
      setProfile(dataToUpload); 
      localStorage.removeItem(`draftProfile_${address}`);
      (window as any).__onChainProfile = dataToUpload;

      alert("Success! Your changes have been published on-chain.");

    } catch (error) {
      console.error("Failed to publish:", error);
      alert(`Failed to publish: ${(error as Error).message}`);
    } finally {
      setIsPublishing(false);
    }
  }, [profile, address, writeContractAsync]);

  // --- Cek Perubahan ---
  const hasUnpublishedChanges = useMemo(() => {
    // Jangan bandingkan jika salah satu belum terdefinisi
    if (!profile || !(window as any).__onChainProfile) return false;
    
    // Bandingkan draf saat ini dengan data on-chain yang disimpan di window
    const draftJson = JSON.stringify(profile);
    const onChainJson = JSON.stringify((window as any).__onChainProfile);
    
    return draftJson !== onChainJson;
    
  }, [profile]);

  const addExtension = (repoUrl: string) => {
    const newExtension: AnimationExtension = {
      id: repoUrl,
      name: repoUrl.split('/').pop() || 'Custom Animation',
    };
    setExtensions((prev) => {
      const newList = [...prev, newExtension];
      localStorage.setItem('animation_extensions', JSON.stringify(newList));
      return newList;
    });
  };

  const value = {
    isAuthenticated,
    isLoading,
    isProfileLoading,
    profile, // Ini adalah 'draftProfile'
    login,
    logout,
    saveDraft, 
    activeAnimation, 
    setActiveAnimation,
    extensions,
    addExtension,
    isHydrated: !isLoading && !isProfileLoading, // Definisikan isHydrated
    isPublishing,
    publishChangesToOnChain,
    hasUnpublishedChanges, // Kirim status ini ke UI

    // Fungsi internal
    _setProfile: setProfile,
    _setIsProfileLoading: setIsProfileLoading,
  };

  return (
    <SessionContext.Provider value={value}>
      <ProfileLoader>
        {children}
      </ProfileLoader>
    </SessionContext.Provider>
  );
};

// Hook kustom 
export const useAnimationStore = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useAnimationStore harus digunakan di dalam SessionProvider');
  }
  return context;
};