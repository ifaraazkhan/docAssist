"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowRight, Smartphone } from "lucide-react";
import { startSignup, sendOtp } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { tap } from "@/lib/haptics";

type Phase = "splash" | "login" | "sent";

export default function LoginPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("splash");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentStatus, setSentStatus] = useState<"existing" | "new" | "resuming">("existing");

  // Splash → check token → route or show login
  useEffect(() => {
    const token = getToken();
    if (token) {
      router.replace("/dashboard");
      return;
    }
    const timer = setTimeout(() => setPhase("login"), 500);
    return () => clearTimeout(timer);
  }, [router]);

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    setError("");
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    setError("");
    tap();
    try {
      const fullPhone = `+91${phone}`;
      const res = await startSignup(fullPhone);
      setSentStatus(res.status);

      if (res.status === "new") {
        // New user → OTP flow
        await sendOtp(fullPhone);
        router.push(`/auth/otp?phone=${encodeURIComponent(fullPhone)}`);
      } else {
        // existing or resuming → magic link sent via WhatsApp
        setPhase("sent");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleUseOtp = async () => {
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    setError("");
    tap();
    try {
      const fullPhone = `+91${phone}`;
      await sendOtp(fullPhone);
      router.push(`/auth/otp?phone=${encodeURIComponent(fullPhone)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[var(--bg)] px-6">
      <AnimatePresence mode="wait">
        {/* ── Splash ── */}
        {phase === "splash" && (
          <motion.div
            key="splash"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageCircle size={36} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold mt-4 text-text-primary">DrCliniq</h1>
          </motion.div>
        )}

        {/* ── Login ── */}
        {phase === "login" && (
          <motion.div
            key="login"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="w-full max-w-sm"
          >
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary">DrCliniq</h1>
              <p className="text-text-secondary text-sm mt-1">
                Smart WhatsApp assistant for your clinic
              </p>
            </div>

            <form onSubmit={handleSendLink} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">
                  Mobile Number
                </label>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-3 py-3 bg-gray-100 rounded-xl text-sm font-medium text-text-secondary min-h-[48px]">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="98765 43210"
                    className="input-field flex-1"
                    autoComplete="tel"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-urgent font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-brand-500 text-white font-semibold rounded-xl text-sm min-h-[48px] disabled:opacity-50 transition-opacity"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Send Login Link via WhatsApp
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={handleUseOtp}
              disabled={loading}
              className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-brand-600 font-medium py-2 min-h-[44px]"
            >
              <Smartphone size={14} />
              Use OTP instead
            </button>

            <p className="text-center text-[11px] text-text-secondary mt-8">
              Built for Indian healthcare professionals
            </p>
          </motion.div>
        )}

        {/* ── Sent confirmation ── */}
        {phase === "sent" && (
          <motion.div
            key="sent"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle size={28} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              {sentStatus === "resuming"
                ? "Complete your signup"
                : "Check your WhatsApp"}
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              {sentStatus === "resuming"
                ? "Open WhatsApp and complete the conversation to finish signing up."
                : "We sent a login link to your WhatsApp. Tap the link to sign in."}
            </p>
            <p className="text-sm text-text-secondary mb-8 font-medium">
              +91 {phone}
            </p>
            <button
              onClick={() => setPhase("login")}
              className="text-sm text-brand-600 font-medium min-h-[44px]"
            >
              ← Use a different number
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
