// app/lib/SessionProvider.tsx

"use client";

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  ReactNode 
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
  isLoading: boolean; 
  profile: Profile | null;
  login: () => Promise<void>;
  logout: () => void;
  saveProfile: (dataToSave: Partial<Profile>) => void; 
  
  activeAnimation: string;
  setActiveAnimation: (anim: string) => Promise<void>;
  extensions: AnimationExtension[];
  addExtension: (url: string) => void;
  isHydrated: boolean;
  isPublishing: boolean;
  publishChangesToOnChain: () => Promise<void>;

  _setProfile: (profile: Profile | null) => void;
  _setIsLoading: (loading: boolean) => void;
  isProfileLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const DEFAULTS = {
  animation: 'dino',
  extensions: [] as AnimationExtension[],
  defaultProfile: {
    projects: [],
    activity: { blogPosts: [], certificates: [], contactEmail: '' },
  } as Profile
};

// --- KOMPONEN HELPER: PROFILE LOADER ---
// Komponen ini akan menangani semua logika PEMBACAAN data
const ProfileLoader = ({ children }: { children: ReactNode }) => {
  const { 
    _setProfile, 
    _setIsProfileLoading,
    isAuthenticated, 
    isPublishing 
  } = useAnimationStore();
  
  const { address } = useAccount();

  // 1. Panggil Smart Contract
  const { 
    data: masterCID, 
    isLoading: isReadingContract, 
    isError, 
    error: readContractError 
  } = useReadContract({
    address: USER_PROFILE_CONTRACT_ADDRESS,
    abi: userProfileAbi,
    functionName: 'getProfileCID',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && isAuthenticated && !isPublishing,
    },
  });
  
  // 2. Efek untuk memuat data dari IPFS
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
      console.error("Gagal membaca smart contract:", readContractError); // <-- Digunakan di sini
      _setProfile(DEFAULTS.defaultProfile); 
      _setIsProfileLoading(false);
      return;
    }

    if (masterCID) {
      // 3. Jika CID ada, ambil data dari IPFS
      const fetchFromIpfs = async (cid: string) => {
        _setIsProfileLoading(true);
        try {
          const url = resolveIpfsUrl(`ipfs://${cid}`);
          if (!url) throw new Error("CID tidak valid");

          const res = await fetch(url);
          
          if (!res.ok) throw new Error("File tidak ditemukan di IPFS");
          const data: Profile = await res.json();
          _setProfile(data); // Sukses!
        } catch (e) {
          console.error("Gagal mengambil JSON dari IPFS:", e);
          _setProfile(DEFAULTS.defaultProfile);
        } finally {
          _setIsProfileLoading(false);
        }
      };
      fetchFromIpfs(masterCID as string);
      
    } else {
      // 4. Jika CID tidak ada (pengguna baru), berikan profil kosong
      _setProfile(DEFAULTS.defaultProfile);
      _setIsProfileLoading(false);
    }

  }, [
    isAuthenticated, 
    masterCID, 
    isReadingContract, 
    isError, 
    readContractError, 
    _setProfile, 
    _setIsProfileLoading
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
    setIsAuthenticated(false);
    setProfile(null); 
    try {
      await fetch('/api/siwe/logout'); 
    } catch (error) {
      console.error("Gagal clear session di server:", error);
    }
    disconnect(); // Ini akan memicu useEffect checkSession
  }, [disconnect]);

  const saveProfile = useCallback((dataToSave: Partial<Profile>) => {
    if (!isAuthenticated) return;
    setProfile(prev => ({ ...(prev as Profile), ...dataToSave })); 
  }, [isAuthenticated]);

  const setActiveAnimation = useCallback(async (newAnimation: string) => {
    saveProfile({ animation: newAnimation });
  }, [saveProfile]);

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
    if (!profile) return alert("Profil belum dimuat.");
    setIsPublishing(true);
    const dataToUpload = { ...profile };

    try {
      // 1. Upload File-file
      if (dataToUpload.pendingImageFile) {
        const cid = await uploadFileToApi(dataToUpload.pendingImageFile);
        dataToUpload.imageUrl = `ipfs://${cid}`;
        delete dataToUpload.pendingImageFile;
      }
      if (dataToUpload.pendingReadmeFile) {
        const cid = await uploadFileToApi(dataToUpload.pendingReadmeFile);
        dataToUpload.readmeUrl = `ipfs://${cid}`;
        dataToUpload.readmeName = dataToUpload.pendingReadmeFile.name;
        delete dataToUpload.pendingReadmeFile;
      } else if (dataToUpload.readmeName === null) {
        dataToUpload.readmeUrl = null;
      }

      for (const project of dataToUpload.projects) {
        if (project.pendingMediaFile) {
          const cid = await uploadFileToApi(project.pendingMediaFile);
          project.mediaIpfsUrl = `ipfs://${cid}`;
          delete project.pendingMediaFile;
          delete project.mediaPreview;
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

      // 4. Perbarui Vercel KV (Cache)
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUpload),
      });

      // 5. Perbarui state React
      setProfile(dataToUpload);

      alert("Sukses! Perubahan Anda telah dipublikasikan ke on-chain.");

    } catch (error) {
      console.error("Gagal memublikasikan:", error);
      alert(`Gagal memublikasikan: ${(error as Error).message}`);
    } finally {
      setIsPublishing(false);
    }
  }, [profile, writeContractAsync]);

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
    isLoading, // Ini untuk cek sesi awal
    profile, 
    login,
    logout,
    saveProfile,
    activeAnimation, 
    setActiveAnimation,
    extensions,
    addExtension,
    isHydrated: !isLoading && !isProfileLoading && !!profile, 
    isPublishing,
    publishChangesToOnChain,

    // Fungsi internal untuk ProfileLoader
    _setProfile: setProfile,
    _setIsProfileLoading: setIsProfileLoading, 
    isProfileLoading, 
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