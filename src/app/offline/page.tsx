"use client";

import { useRouter } from "next/navigation";
import { WifiOff, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { tap } from "@/lib/haptics";

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    tap();
    if (navigator.onLine) {
      router.push("/dashboard");
    } else {
      toast("Still offline — check your connection");
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-[var(--bg)]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center text-center"
      >
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <WifiOff size={36} className="text-gray-400" />
        </div>

        <h1 className="text-xl font-bold text-text-primary mb-2">
          You&apos;re offline
        </h1>
        <p className="text-text-secondary text-sm max-w-xs mb-8">
          Connect to the internet to use DrCliniq
        </p>

        <button
          onClick={handleRetry}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white font-semibold rounded-xl text-sm min-h-[48px]"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </motion.div>
    </div>
  );
}
