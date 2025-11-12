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

// Tipe ekstensi 
export interface AnimationExtension {
  id: string;
  name: string;
}

// Tipe state sesi
interface SessionContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  activeAnimation: string;
  setActiveAnimation: (anim: string) => Promise<void>;
  extensions: AnimationExtension[];
  addExtension: (url: string) => void;
  isHydrated: boolean;
}

// Buat Context
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Nilai default
const DEFAULTS = {
  animation: 'dino',
  extensions: [] as AnimationExtension[],
};

// Buat Provider
export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { address, chainId: wagmiChainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const chainId = wagmiChainId || 1;

  // Semua state yang sebelumnya ada di 'useUserSessionStore' sekarang ada di sini
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeAnimation, setLocalAnimation] = useState(() => {
    if (typeof window === 'undefined') return DEFAULTS.animation;
    return localStorage.getItem('animation_setting') || DEFAULTS.animation;
  });
  
  const [extensions, setExtensions] = useState<AnimationExtension[]>(() => {
    if (typeof window === 'undefined') return DEFAULTS.extensions;
    return JSON.parse(localStorage.getItem('animation_extensions') || '[]');
  });

  // Efek ini sekarang akan berjalan sekali dan state-nya akan persisten
  useEffect(() => {
    const checkSession = async () => {
      if (!address) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/user/preference');
        if (response.ok) {
          const data = await response.json();
          setLocalAnimation(data.animation);
          localStorage.setItem('animation_setting', data.animation); // Sinkronkan cache
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, [address]); // Hanya bergantung pada 'address'

  // Fungsi Login 
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
      const data = await verifyRes.json();
      setIsAuthenticated(true);
      setLocalAnimation(data.animation);
      localStorage.setItem('animation_setting', data.animation); // Simpan ke cache
    } catch (error) {
      console.error('Login gagal:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [address, chainId, signMessageAsync]);

  // Fungsi Simpan Animasi 
  const setActiveAnimation = useCallback(async (newAnimation: string) => {
    setLocalAnimation(newAnimation);
    localStorage.setItem('animation_setting', newAnimation);
    
    if (isAuthenticated) {
      try {
        await fetch('/api/user/preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ animation: newAnimation }),
        });
      } catch (error) {
        console.error('Gagal menyimpan preferensi:', error);
      }
    }
  }, [isAuthenticated]);

  const logout = useCallback(async () => {
    // A. Langsung update UI 
    setIsAuthenticated(false);
    
    // B. Beri tahu server untuk menghancurkan cookie sesi
    try {
      await fetch('/api/siwe/logout'); 
    } catch (error) {
      console.error("Gagal clear session di server:", error);
    }
    
    disconnect();
    
  }, [disconnect]);
  
  // Fungsi Ekstensi 
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

  // Nilai yang akan dibagikan ke semua komponen
  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
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

// Hook kustom yang akan digunakan oleh komponen
export const useAnimationStore = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useAnimationStore harus digunakan di dalam SessionProvider');
  }
  return context;
};