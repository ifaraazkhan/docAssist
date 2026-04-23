"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/lib/network";

export default function NetworkBanner() {
  const isOnline = useOnlineStatus();
  const wasOffline = useRef(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      setShowBackOnline(true);
      const t = setTimeout(() => setShowBackOnline(false), 2000);
      return () => clearTimeout(t);
    }
  }, [isOnline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="alert"
          className="bg-red-500 text-white text-center text-sm font-medium py-2 px-4 flex items-center justify-center gap-2"
        >
          <WifiOff size={14} />
          No internet connection
        </motion.div>
      )}
      {showBackOnline && (
        <motion.div
          key="online"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="status"
          className="bg-green-500 text-white text-center text-sm font-medium py-2 px-4 flex items-center justify-center gap-2"
        >
          <Wifi size={14} />
          Back online
        </motion.div>
      )}
    </AnimatePresence>
  );
}
