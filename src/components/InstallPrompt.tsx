"use client";

import { motion } from "framer-motion";
import { Download, X } from "lucide-react";
import { useInstallPrompt } from "./ServiceWorkerRegistrar";
import { tap, success as hapticSuccess } from "@/lib/haptics";

export default function InstallPrompt() {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => { tap(); dismiss(); }}
        className="fixed inset-0 bg-black/30 z-40"
      />

      {/* Slide-up card */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <div className="max-w-sm mx-auto">
          {/* Card with top rounded corners */}
          <div className="bg-white rounded-t-3xl shadow-elevated pt-3 pb-10">
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-5" />

            <div className="px-6 text-center">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
                <Download size={28} className="text-brand-600" />
              </div>

              {/* Text */}
              <h3 className="text-lg font-bold text-text-primary">Add DrCliniq</h3>
              <p className="text-sm text-text-secondary mt-1">
                Install on your home screen for quick access
              </p>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { tap(); dismiss(); }}
                  className="flex-1 py-3.5 bg-gray-100 text-text-primary font-semibold rounded-xl text-sm min-h-[48px]"
                >
                  Not Now
                </button>
                <button
                  onClick={() => { hapticSuccess(); promptInstall(); }}
                  className="flex-1 py-3.5 bg-brand-500 text-white font-semibold rounded-xl text-sm min-h-[48px]"
                >
                  Install App
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
