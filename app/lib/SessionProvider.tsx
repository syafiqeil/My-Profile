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

// --- ALAMAT & ABI KONTRAK ---
const USER_PROFILE_CONTRACT_ADDRESS = '0x8c09c9d8ab25b81e5a9e1462f9bdc83dfcc7d7bf99';
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

// --- Tipe Data (Sama seperti sebelumnya) ---
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

// --- Tipe Konteks (Diperbarui) ---
interface SessionContextType {
  isAuthenticated: boolean;
  isLoading: boolean; // Kita kembalikan isLoading untuk ProfileLoader
  profile: Profile | null;
  login: () => Promise<void>;
  logout: () => void;
  saveProfile: (dataToSave: Partial<Profile>) => void; // Simpan ke state
  
  activeAnimation: string;
  setActiveAnimation: (anim: string) => Promise<void>;
  extensions: AnimationExtension[];
  addExtension: (url: string) => void;
  isHydrated: boolean;
  
  isPublishing: boolean;
  publishChangesToOnChain: () => Promise<void>;

  // Fungsi baru untuk dipanggil oleh ProfileLoader
  _setProfile: (profile: Profile | null) => void;
  _setIsLoading: (loading: boolean) => void;
  _setIsAuthenticated: (auth: boolean) => void;
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

// --- KOMPONEN HELPER BARU: PROFILE LOADER ---
// Komponen ini akan menangani semua logika PEMBACAAN data
const ProfileLoader = ({ children }: { children: ReactNode }) => {
  const { 
    _setProfile, 
    _setIsLoading, 
    _setIsAuthenticated,
    isPublishing // Kita gunakan ini untuk mencegah reload saat mempublikasikan
  } = useAnimationStore();
  
  const { address, isConnected } = useAccount();
  const [isFetchingIpfs, setIsFetchingIpfs] = useState(false);

  // 1. Panggil Smart Contract (Hook Reaktif)
  const { data: masterCID, isLoading: isReadingContract, isError, refetch } = useReadContract({
    address: USER_PROFILE_CONTRACT_ADDRESS,
    abi: userProfileAbi,
    functionName: 'getProfileCID',
    args: [address as `0x${string}`], // Ambil data untuk alamat yang terhubung
    query: {
      enabled: !!address && !isPublishing, // Hanya jalankan jika ada alamat & tidak sedang publish
    },
  });
  
  // 2. Efek untuk memuat data dari IPFS saat masterCID berubah
  useEffect(() => {
    if (!address) {
      _setIsAuthenticated(false);
      _setProfile(null);
      return;
    }

    if (isReadingContract) {
      _setIsLoading(true);
      return;
    }

    if (isError) {
      console.error("Gagal membaca dari smart contract.");
      _setIsAuthenticated(true); // Tetap login, tapi profil gagal dimuat
      _setProfile(DEFAULTS.defaultProfile);
      _setIsLoading(false);
      return;
    }
    
    // Jika tidak ada error, kita terautentikasi
    _setIsAuthenticated(true);

    if (masterCID) {
      // 3. Jika CID ada, ambil data dari IPFS
      const fetchFromIpfs = async (cid: string) => {
        setIsFetchingIpfs(true);
        _setIsLoading(true);
        try {
          const res = await fetch(`https://gateway.ipfs.io/ipfs/${cid}`);
          if (!res.ok) throw new Error("File tidak ditemukan di IPFS");
          const data: Profile = await res.json();
          _setProfile(data);
        } catch (e) {
          console.error("Gagal mengambil JSON dari IPFS:", e);
          _setProfile(DEFAULTS.defaultProfile); // Gagal fetch, beri profil kosong
        } finally {
          setIsFetchingIpfs(false);
          _setIsLoading(false);
        }
      };
      fetchFromIpfs(masterCID as string);
      
    } else {
      // 4. Jika CID tidak ada (pengguna baru), berikan profil kosong
      _setProfile(DEFAULTS.defaultProfile);
      _setIsLoading(false);
    }

  }, [address, masterCID, isReadingContract, isError, _setProfile, _setIsLoading, _setIsAuthenticated]);

  return <>{children}</>;
};

// --- PROVIDER UTAMA ---
export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { address, chainId: wagmiChainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const chainId = wagmiChainId || 1;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Sekarang dikontrol oleh ProfileLoader
  const [profile, setProfile] = useState<Profile | null>(null);
  const [extensions, setExtensions] = useState<AnimationExtension[]>(() => {
    if (typeof window === 'undefined') return DEFAULTS.extensions;
    return JSON.parse(localStorage.getItem('animation_extensions') || '[]');
  });

  const [isPublishing, setIsPublishing] = useState(false);
  const { writeContractAsync } = useWriteContract();

  // --- HAPUS fetchProfile() dan useEffect[address] (checkSession) ---
  // Seluruh logika tersebut sekarang ditangani oleh <ProfileLoader />

  // --- Fungsi Login (Disederhanakan) ---
  const login = useCallback(async () => {
    if (!address || !chainId) return;
    setIsLoading(true);
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
      
      // SUKSES! Cukup set 'true'. ProfileLoader akan menangani sisanya.
      setIsAuthenticated(true); 
      // Kita tidak perlu memanggil fetchProfile() lagi.
      
    } catch (error) {
      console.error('Login gagal:', error);
      setIsAuthenticated(false);
      setProfile(null);
    } finally {
      // Biarkan ProfileLoader yang mengatur isLoading
      // setIsLoading(false);
    }
  }, [address, chainId, signMessageAsync]);

  // ... (fungsi logout SAMA) ...
  const logout = useCallback(async () => {
    setIsAuthenticated(false);
    setProfile(null); 
    try {
      await fetch('/api/siwe/logout'); 
    } catch (error) {
      console.error("Gagal clear session di server:", error);
    }
    disconnect();
  }, [disconnect]);

  // ... (fungsi saveProfile SAMA, setActiveAnimation SAMA) ...
  const saveProfile = useCallback((dataToSave: Partial<Profile>) => {
    if (!isAuthenticated) return;
    setProfile(prev => ({ ...(prev as Profile), ...dataToSave })); 
  }, [isAuthenticated]);

  const setActiveAnimation = useCallback(async (newAnimation: string) => {
    saveProfile({ animation: newAnimation });
  }, [saveProfile]);

  const activeAnimation = profile?.animation || DEFAULTS.animation;

  // ... (Helper uploadFileToApi & uploadJsonToApi SAMA) ...
  const uploadFileToApi = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Gagal mengunggah file.');
    return data.ipfsHash;
  };
  
  const uploadJsonToApi = async (data: object): Promise<string> => {
    const response = await fetch('/api/upload-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal mengunggah JSON.');
    return result.ipfsHash;
  };

  // ... (Fungsi "OTAK" publishChangesToOnChain SAMA PERSIS) ...
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
    isLoading,
    profile, 
    login,
    logout,
    saveProfile, 
    activeAnimation, 
    setActiveAnimation: setActiveAnimation as (anim: string) => Promise<void>,
    extensions,
    addExtension,
    isHydrated: !isLoading,
    isPublishing,
    publishChangesToOnChain,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
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