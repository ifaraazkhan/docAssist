"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import OtpInput from "react-otp-input";
import { verifyOtp, sendOtp } from "@/lib/api";
import { saveToken, saveDoctor } from "@/lib/auth";
import { tap, success as hapticSuccess, error as hapticError } from "@/lib/haptics";

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerify = useCallback(
    async (code: string) => {
      if (code.length !== 6 || !phone) return;
      setLoading(true);
      setError("");
      try {
        const res = await verifyOtp(phone, code);
        saveToken(res.token);
        saveDoctor(res.doctor);
        hapticSuccess();

        if (res.doctor.onboardingComplete) {
          router.replace("/dashboard");
        } else {
          router.replace("/onboarding");
        }
      } catch (err) {
        hapticError();
        setError(err instanceof Error ? err.message : "Invalid OTP");
        setOtp("");
      } finally {
        setLoading(false);
      }
    },
    [phone, router]
  );

  const handleOtpChange = (value: string) => {
    tap();
    setOtp(value);
    setError("");
    if (value.length === 6) {
      handleVerify(value);
    }
  };

  const handleResend = async () => {
    if (!canResend || !phone) return;
    try {
      await sendOtp(phone);
      setResendTimer(60);
      setCanResend(false);
      setError("");
      tap();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    }
  };

  if (!phone) {
    router.replace("/");
    return null;
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg)] px-6">
      <div className="pt-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-text-secondary min-h-[44px] min-w-[44px] flex items-center"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-1 flex flex-col items-center pt-12 max-w-sm mx-auto w-full"
      >
        <h1 className="text-2xl font-bold text-text-primary mb-2">Enter OTP</h1>
        <p className="text-sm text-text-secondary mb-8 text-center">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-text-primary">{phone}</span>
        </p>

        <div className="mb-6">
          <OtpInput
            value={otp}
            onChange={handleOtpChange}
            numInputs={6}
            shouldAutoFocus
            inputType="number"
            renderInput={(props) => (
              <input
                {...props}
                className="!w-12 !h-14 text-center text-xl font-bold border-2 rounded-xl mx-1 transition-colors focus:border-brand-500 focus:outline-none"
                style={{
                  borderColor: error ? "#ef4444" : otp.length > 0 ? "#0d9488" : "#e5e7eb",
                }}
                disabled={loading}
              />
            )}
          />
        </div>

        {error && (
          <p className="text-sm text-urgent font-medium mb-4">{error}</p>
        )}

        {loading && (
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        )}

        <button
          onClick={handleResend}
          disabled={!canResend}
          className="flex items-center gap-2 text-sm font-medium min-h-[44px] transition-colors"
          style={{ color: canResend ? "#0d9488" : "#9ca3af" }}
        >
          <RefreshCw size={14} />
          {canResend ? "Resend OTP" : `Resend in ${resendTimer}s`}
        </button>
      </motion.div>
    </div>
  );
}

export default function OtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)]">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OtpContent />
    </Suspense>
  );
}
