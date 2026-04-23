"use client";

import { useEffect, createContext, useContext, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

interface InstallPromptContextType {
  canInstall: boolean;
  promptInstall: () => Promise<void>;
  dismiss: () => void;
}

const InstallPromptContext = createContext<InstallPromptContextType>({
  canInstall: false,
  promptInstall: async () => {},
  dismiss: () => {},
});

export const useInstallPrompt = () => useContext(InstallPromptContext);

export function InstallPromptProvider({ children }: { children: React.ReactNode }) {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setCanInstall(false);
  }, []);

  const dismiss = useCallback(() => {
    deferredPrompt.current = null;
    setCanInstall(false);
  }, []);

  return (
    <InstallPromptContext.Provider value={{ canInstall, promptInstall, dismiss }}>
      {children}
    </InstallPromptContext.Provider>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      registration.onupdatefound = () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.onstatechange = () => {
          if (newWorker.state === "activated" && navigator.serviceWorker.controller) {
            toast("New version available", {
              action: {
                label: "Update",
                onClick: () => window.location.reload(),
              },
            });
          }
        };
      };
    }).catch(() => {
      // SW registration failed — fine for development
    });
  }, []);

  return null;
}
