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
import { useAccount, useSignMessage, useChainId, useDisconnect } from 'wagmi'; 
import { SiweMessage } from 'siwe';

// --- 1. DEFINISIKAN TIPE PROFIL ---
export interface Profile {
  name: string;
  bio: string;
  github: string;
  animation: string;
  // projects: any[];
  // activity: any;
}

export interface AnimationExtension {
  id: string;
  name: string;
}

interface SessionContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: Profile | null;
  login: () => Promise<void>;
  logout: () => void;
  saveProfile: (dataToSave: Partial<Profile>) => Promise<void>; 
  
  activeAnimation: string;
  setActiveAnimation: (anim: string) => Promise<void>;
  extensions: AnimationExtension[];
  addExtension: (url: string) => void;
  isHydrated: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const DEFAULTS = {
  animation: 'dino',
  extensions: [] as AnimationExtension[],
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { address, chainId: wagmiChainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const chainId = wagmiChainId || 1;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null); // <-- 4. BUAT STATE PROFIL

  // State lama untuk animasi (sekarang dikendalikan oleh 'profile')
  const [extensions, setExtensions] = useState<AnimationExtension[]>(() => {
    if (typeof window === 'undefined') return DEFAULTS.extensions;
    return JSON.parse(localStorage.getItem('animation_extensions') || '[]');
  });

  // Helper untuk mengambil profil dari server
  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile'); // Panggil API GET baru
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile); // Simpan profil ke state
        return data.profile;
      } else if (response.status === 404) {
        setProfile(null); // Pengguna baru, profil null
      } else {
        setIsAuthenticated(false); // Gagal (mungkin sesi tidak valid)
        setProfile(null);
      }
    } catch (error) {
      console.error("Gagal mengambil profil:", error);
      setIsAuthenticated(false);
      setProfile(null);
    }
  };
  
  // Efek cek sesi: sekarang juga mengambil profil
  useEffect(() => {
    const checkSession = async () => {
      if (!address) {
        setIsAuthenticated(false);
        setProfile(null);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      await fetchProfile(); // Coba ambil profil
      // fetchProfile akan mengatur isAuthenticated berdasarkan respons server
      // (Kita asumsikan jika fetchProfile berhasil, sesi sudah ada, tapi API kita belum melakukan itu)
      // Mari kita perbaiki: checkSession harusnya hanya cek auth.
      
      // --- Logika yang Diperbaiki ---
      try {
        const res = await fetch('/api/user/profile'); // Gunakan ini untuk cek sesi
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setIsAuthenticated(true);
        } else if (res.status === 404) {
           setProfile(null);
           setIsAuthenticated(true); // Tetap terautentikasi, hanya profilnya null
        } else {
           // Gagal (401, dll)
           setIsAuthenticated(false);
           setProfile(null);
        }
      } catch (e) {
         setIsAuthenticated(false);
         setProfile(null);
      }
      // -------------------------

      setIsLoading(false);
    };
    checkSession();
  }, [address]);

  // Fungsi Login: sekarang juga mengambil profil setelah sukses
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
      
      // Sukses!
      setIsAuthenticated(true);
      await fetchProfile(); // Ambil profil pengguna setelah login

    } catch (error) {
      console.error('Login gagal:', error);
      setIsAuthenticated(false);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [address, chainId, signMessageAsync]);

  // Fungsi Logout: sekarang juga membersihkan profil
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

  // --- 5. FUNGSI UNTUK MENYIMPAN PROFIL ---
  const saveProfile = useCallback(async (dataToSave: Partial<Profile>) => {
    if (!isAuthenticated) return;
    
    // Optimistic update
    const oldProfile = profile;
    setProfile(prev => ({ ...(prev as Profile), ...dataToSave })); 
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });
      if (!res.ok) {
        throw new Error('Gagal menyimpan ke server');
      }
      // Data sudah disimpan, state lokal sudah benar
    } catch (error) {
      console.error("Gagal menyimpan profil:", error);
      setProfile(oldProfile); 
    }
  }, [isAuthenticated, profile]);

  const setActiveAnimation = useCallback(async (newAnimation: string) => {
    await saveProfile({ animation: newAnimation });
  }, [saveProfile]);

  const activeAnimation = profile?.animation || DEFAULTS.animation;

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