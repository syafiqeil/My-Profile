// app/providers.tsx
"use client"; 

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { base, baseSepolia } from "wagmi/chains"; 
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useState, useEffect } from 'react';

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: "Syafiq's Dashboard dApp",
  projectId: "3c6f8194ad518fc56054b0107d9fbfa9", 
  chains: [base, baseSepolia],
  ssr: false, 
});

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  // state 'isMounted' 
  //    (Akan 'false' di server, dan 'true' setelah di-mount di klien)
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []); 

  // Jika belum di-mount, jangan render apa-apa 
  if (!isMounted) {
    return null;
  }
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};