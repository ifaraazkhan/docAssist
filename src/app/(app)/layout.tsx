"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import NetworkBanner from "@/components/NetworkBanner";
import InstallPrompt from "@/components/InstallPrompt";
import { InstallPromptProvider } from "@/components/ServiceWorkerRegistrar";
import { getToken } from "@/lib/auth";
import { getMe } from "@/lib/api";
import type { Doctor } from "@/lib/api";
import { useOnlineStatus } from "@/lib/network";
import { DoctorContext } from "@/lib/doctor-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/");
      return;
    }

    getMe()
      .then((res) => {
        setDoctor(res.doctor);
        setLoading(false);
      })
      .catch(() => {
        router.replace("/");
      });
  }, [router]);

  useEffect(() => {
    if (!isOnline) {
      router.replace("/offline");
    }
  }, [isOnline, router]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <InstallPromptProvider>
      <DoctorContext.Provider value={doctor}>
        <div className="min-h-dvh bg-[var(--bg)]">
          <NetworkBanner />
          {children}
          <BottomNav />
          <InstallPrompt />
        </div>
      </DoctorContext.Provider>
    </InstallPromptProvider>
  );
}
