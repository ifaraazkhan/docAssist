"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Copy, Share2, Gift } from "lucide-react";
import { useDoctor } from "@/lib/doctor-context";
import { tap, success as hapticSuccess } from "@/lib/haptics";

export default function ReferPage() {
  const router = useRouter();
  const doctor = useDoctor();

  const referralCode = doctor.doctorCode;
  const referralLink = `https://drcliniq.com/join?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      hapticSuccess();
      toast("Referral link copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const handleShare = async () => {
    tap();
    const text = `Hey! I've been using DrCliniq to automate my WhatsApp clinic replies — saves me hours every week. Try it out: ${referralLink}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join DrCliniq",
          text,
          url: referralLink,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      {/* Header */}
      <div className="bg-white border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1 -ml-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft size={20} className="text-text-primary" />
        </button>
        <h1 className="font-semibold text-text-primary">Refer a Doctor</h1>
      </div>

      <div className="page-container max-w-sm mx-auto text-center">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 mb-8"
        >
          <div className="w-20 h-20 bg-violet-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Gift size={32} className="text-violet-600" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Share DrCliniq with colleagues
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Help fellow doctors automate their WhatsApp clinic.
            Both of you get extended free trial when they sign up.
          </p>
        </motion.div>

        {/* Referral code */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card mb-5"
        >
          <p className="text-xs text-text-secondary mb-2">Your referral code</p>
          <p className="text-2xl font-bold text-violet-700 tracking-widest mb-4">{referralCode}</p>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
            <p className="flex-1 text-sm text-text-primary truncate font-mono text-left">{referralLink}</p>
            <button
              onClick={handleCopy}
              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center bg-white rounded-lg border border-gray-200"
              aria-label="Copy referral link"
            >
              <Copy size={14} className="text-violet-600" />
            </button>
          </div>
        </motion.div>

        {/* Share button */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-600 text-white font-semibold rounded-xl text-sm min-h-[48px]"
          >
            <Share2 size={16} />
            Share with a Doctor
          </button>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-left"
        >
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            How it works
          </h3>
          <div className="space-y-3">
            {[
              { step: "1", text: "Share your link or code with a doctor friend" },
              { step: "2", text: "They sign up using your referral" },
              { step: "3", text: "Both of you get an extended free trial" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="w-6 h-6 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {item.step}
                </span>
                <p className="text-sm text-text-primary pt-0.5">{item.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
