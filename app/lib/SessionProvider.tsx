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
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const DEFAULTS = {
  animation: 'dino',
  extensions: [] as AnimationExtension[],
  defaultProfile: {
    name: '', bio: '', github: '', animation: 'dino',
    projects: [],
    activity: { blogPosts: [], certificates: [], contactEmail: '' },
  } as Profile
};

// --- KOMPONEN HELPER: PROFILE LOADER ---
// Tugasnya: 1. Baca dari On-Chain. 2. Baca dari localStorage. 3. Tentukan state.
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
    if (!isAuthenticated) {
      _setProfile(null);
      return;
    }
    if (isReadingContract) {
      _setIsProfileLoading(true);
      return;
    }
    if (isError) {
      console.error("Gagal membaca smart contract:", readContractError);
      _setIsProfileLoading(false);
      return;
    }

    const loadProfileData = async () => {
      _setIsProfileLoading(true);
      let loadedProfile: Profile | null = null;
      let dataSource: string = "";

      // 1. Cek Draf Lokal
      const localDraftJson = localStorage.getItem(`draftProfile_${address}`);
      if (localDraftJson) {
        console.log("Memuat draf lokal dari localStorage...");
        loadedProfile = JSON.parse(localDraftJson);
        dataSource = "Draf Lokal";
      }
      
      // 2. Jika tidak ada draf, coba ambil dari On-Chain (via Proxy JSON)
      else if (masterCID) {
        try {
          console.log("Mencoba mengambil data on-chain dari Proxy JSON...");
          const res = await fetch(`/api/proxy-json?cid=${masterCID}`); 
          if (res.ok) {
            loadedProfile = await res.json();
            dataSource = "Proxy JSON (On-Chain)";
          } else {
            throw new Error(`Proxy JSON fetch gagal: status ${res.status}`);
          }
        } catch (e) {
          console.warn("Gagal mengambil data dari IPFS/Proxy:", e);
        }
      }

      // 3. Jika IPFS/Proxy gagal, coba ambil dari Cache Server (Vercel KV)
      if (!loadedProfile) {
        try {
          console.log("IPFS/Proxy gagal, mencoba mengambil dari cache server (/api/user/profile)...");
          const res = await fetch('/api/user/profile');
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              loadedProfile = data.profile;
              dataSource = "Cache Server (Vercel KV)";
            }
          }
        } catch (e) {
          console.error("Gagal mengambil data dari cache server:", e);
        }
      }

      // 4. Atur State
      if (loadedProfile) {
        console.log(`Profil berhasil dimuat dari: ${dataSource}`);
        _setProfile(loadedProfile);
        
        if (dataSource !== "Draf Lokal") {
          (window as any).__onChainProfile = loadedProfile;
        }
      } else {
        console.log("Semua sumber gagal, memuat profil default.");
        _setProfile(DEFAULTS.defaultProfile);
        (window as any).__onChainProfile = DEFAULTS.defaultProfile;
      }

      _setIsProfileLoading(false);
    };

    loadProfileData();

  }, [isAuthenticated, masterCID, isReadingContract, isError, address, _setProfile, _setIsProfileLoading]); // 'readContractError' dihapus dari deps array karena sudah dicek di atas

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
        // Cek ke server apakah kita punya sesi Iron Session
        const res = await fetch('/api/user/profile');
        
        if (res.ok || res.status === 404) {
           // Jika server bilang OK (200) atau NotFound (404, pengguna baru)
           // berarti kita punya sesi yang valid.
           setIsAuthenticated(true);
        } else {
           // Jika server bilang 401 (Unauthorized) atau lainnya
           setIsAuthenticated(false);
           setProfile(null);
        }
      } catch (e) {
         setIsAuthenticated(false);
         setProfile(null);
      } finally {
        setIsLoading(false); // Selesai memuat sesi
      }
    };
    checkSession();
  }, [address]); // <--- Dijalankan setiap kali alamat dompet berubah

  // --- Fungsi Login ---
  const login = useCallback(async () => {
    if (!address || !chainId) return;
    setIsLoading(true); // Tampilkan loading
    try {
      const nonceRes = await fetch('/api/siwe/nonce');
      const nonce = await nonceRes.text();
      const message = new SiweMessage({
        domain: window.location.host, address,
        statement: 'Masuk ke Dasbor Syafiq',
        uri: window.location.origin, version: '1',
        chainId, nonce,
      });
      const signature = await signMessageAsync({ message: message.prepareMessage() });
      const verifyRes = await fetch('/api/siwe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.prepareMessage(), signature }),
      });
      if (!verifyRes.ok) throw new Error('Verifikasi gagal');
      
      // SUKSES! Set auth ke true.
      setIsAuthenticated(true); 
      // ProfileLoader sekarang akan otomatis mengambil data
      
    } catch (error) {
      console.error('Login gagal:', error);
      setIsAuthenticated(false);
      setProfile(null);
    } finally {
      setIsLoading(false); // Selesai
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
      console.error("Gagal clear session di server:", error);
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

  const uploadFileToApi = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server error /api/upload:", errorText);
      throw new Error(`Gagal mengunggah file (${response.status}). Server: ${errorText}`);
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
      throw new Error(`Gagal mengunggah JSON (${response.status}). Server: ${errorText}`);
    }
    const result = await response.json();
    return result.ipfsHash;
  };

  const publishChangesToOnChain = useCallback(async () => {
    if (!profile || !address) return alert("Profil belum dimuat.");
    
    setIsPublishing(true);
    let dataToUpload = { ...profile }; // Ambil DRAF saat ini

    try {
      // 1. Upload semua file mentah (pending)
      dataToUpload = JSON.parse(JSON.stringify(profile));

      // Fungsi helper untuk mengubah blob: kembali ke File
      const blobUrlToFile = async (blobUrl: string): Promise<File | null> => {
        try {
          const response = await fetch(blobUrl);
          const blob = await response.blob();
          return new File([blob], "upload", { type: blob.type });
        } catch (e) { return null; }
      };

      // Upload Foto Profil
      if (dataToUpload.pendingImageFile) {
        const file = await blobUrlToFile(dataToUpload.pendingImageFile as any);
        if (file) {
          const cid = await uploadFileToApi(file);
          dataToUpload.imageUrl = `ipfs://${cid}`;
        }
      }
      // Hapus data mentah
      delete dataToUpload.pendingImageFile;
     
      // Upload Foto Profil (jika blob)
      if (dataToUpload.imageUrl && dataToUpload.imageUrl.startsWith('blob:')) {
        const file = await blobUrlToFile(dataToUpload.imageUrl);
        if(file) dataToUpload.imageUrl = `ipfs://${await uploadFileToApi(file)}`;
      }

      // Upload Readme (jika blob)
      if (dataToUpload.readmeUrl && dataToUpload.readmeUrl.startsWith('blob:')) {
        const file = await blobUrlToFile(dataToUpload.readmeUrl);
        if(file) dataToUpload.readmeUrl = `ipfs://${await uploadFileToApi(file)}`;
      }

      // Upload Media Proyek (jika blob)
      for (const project of dataToUpload.projects) {
        if (project.mediaPreview && project.mediaPreview.startsWith('blob:')) {
          const file = await blobUrlToFile(project.mediaPreview);
          if (file) {
            project.mediaIpfsUrl = `ipfs://${await uploadFileToApi(file)}`;
            project.mediaPreview = null; // Hapus blob
          }
        }
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
      setProfile(dataToUpload); // Atur state ke data yang sudah bersih (tanpa blob)
      localStorage.removeItem(`draftProfile_${address}`); // Hapus draf
      (window as any).__onChainProfile = dataToUpload; // Perbarui data on-chain

      alert("Sukses! Perubahan Anda telah dipublikasikan ke on-chain.");

    } catch (error) {
      console.error("Gagal memublikasikan:", error);
      alert(`Gagal memublikasikan: ${(error as Error).message}`);
    } finally {
      setIsPublishing(false);
    }

  }, [profile, address, writeContractAsync]);

  // --- Cek Perubahan ---
  const hasUnpublishedChanges = useMemo(() => {
    if (!profile || !(window as any).__onChainProfile) return false;
    // Perbandingan sederhana. Untuk perbandingan 'deep', kita perlu library.
    return JSON.stringify(profile) !== JSON.stringify((window as any).__onChainProfile);
  }, [profile]);

  const addExtension = (repoUrl: string) => {
    const newExtension: AnimationExtension = {
      id: repoUrl,
      name: repoUrl.split('/').pop() || 'Animasi Kustom',
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
    saveDraft, // Ganti 'saveProfile' dengan 'saveDraft'
    saveProfile: saveDraft, // Alias untuk kompatibilitas
    activeAnimation, 
    setActiveAnimation,
    extensions,
    addExtension,
    isHydrated: !isLoading && !isProfileLoading && !!profile,
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