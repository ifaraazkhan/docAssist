"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, MessageCircle } from "lucide-react";
import { verifyMagicLink } from "@/lib/api";
import { saveToken, saveDoctor } from "@/lib/auth";
import { success as hapticSuccess, error as hapticError } from "@/lib/haptics";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    // Strip token from URL immediately
    window.history.replaceState({}, "", "/auth/verify");

    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token found");
      return;
    }

    verifyMagicLink(token)
      .then((res) => {
        saveToken(res.token);
        saveDoctor(res.doctor);
        setStatus("success");
        hapticSuccess();

        setTimeout(() => {
          if (res.doctor.onboardingComplete) {
            router.replace("/dashboard");
          } else {
            router.replace("/onboarding");
          }
        }, 500);
      })
      .catch((err) => {
        setStatus("error");
        hapticError();
        const msg = err instanceof Error ? err.message : "Verification failed";
        if (msg.includes("expired")) {
          setErrorMsg("This link has expired. Please request a new one.");
        } else if (msg.includes("used") || msg.includes("invalid")) {
          setErrorMsg("This link is no longer valid. Please request a new one.");
        } else {
          setErrorMsg(msg);
        }
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] px-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-sm w-full"
      >
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Verifying your link...</h2>
            <p className="text-sm text-text-secondary mt-2">This will just take a moment</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Verified!</h2>
            <p className="text-sm text-text-secondary mt-2">Redirecting you now...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-2">Verification failed</h2>
            <p className="text-sm text-text-secondary mb-6">{errorMsg}</p>
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-brand-500 text-white font-semibold rounded-xl text-sm min-h-[48px]"
            >
              <MessageCircle size={16} />
              Request new link
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)]">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
