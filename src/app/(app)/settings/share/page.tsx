"use client";

import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import useSWR from "swr";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { ArrowLeft, Copy, Share2, Download } from "lucide-react";
import html2canvas from "html2canvas";
import { getShareInfo } from "@/lib/api";
import { useDoctor } from "@/lib/doctor-context";
import { tap, success as hapticSuccess } from "@/lib/haptics";

function titleCase(str: string) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SharePage() {
  const router = useRouter();
  const doctor = useDoctor();
  const { data, isLoading } = useSWR("share-info", () => getShareInfo());
  const qrRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  const doctorCode = data?.doctorCode ?? doctor.doctorCode;

  // QR and share link — use API response (points to DrCliniq business number)
  const qrValue = data?.qrData ?? "";
  const shareUrl = data?.qrData ?? "";

  const clinicName = titleCase(doctor.clinicName ?? doctor.name ?? "My Clinic");
  const doctorName = titleCase(doctor.name ?? "Doctor");
  const specialtyText = doctor.specialty ? titleCase(doctor.specialty) : "";
  const addressParts = [doctor.clinicAddress, doctor.city].filter(Boolean).join(", ");
  const timingText =
    doctor.clinicHoursStart && doctor.clinicHoursEnd
      ? `${doctor.clinicHoursStart} – ${doctor.clinicHoursEnd}`
      : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      hapticSuccess();
      toast("Link copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const handleShare = async () => {
    tap();
    if (navigator.share) {
      try {
        await navigator.share({
          title: clinicName,
          text: `*${clinicName}* — Message us on WhatsApp for appointments and health queries.`,
          url: shareUrl,
        });
      } catch {
        /* cancelled */
      }
    } else {
      handleCopy();
    }
  };

  // ── HTML-based poster download via html2canvas ──
  const handleDownloadPoster = useCallback(async () => {
    tap();
    const el = posterRef.current;
    if (!el) return;

    // Temporarily show the poster for capture
    el.style.display = "block";

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f0f0f5",
      });

      const a = document.createElement("a");
      a.download = `${clinicName.replace(/\s+/g, "-")}-WhatsApp-QR.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();

      hapticSuccess();
      toast("Poster downloaded — print and stick at your clinic!");
    } catch {
      toast.error("Failed to generate poster");
    } finally {
      el.style.display = "none";
    }
  }, [clinicName]);

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
        <h1 className="font-semibold text-text-primary">Share Clinic QR</h1>
      </div>

      <div className="page-container max-w-sm mx-auto text-center">
        {/* QR Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card mt-4 mb-6"
        >
          <p className="text-lg font-bold text-text-primary mb-0.5">{clinicName}</p>
          <p className="text-xs text-text-secondary mb-5">
            Scan to message on WhatsApp
          </p>

          {/* QR Code */}
          <div ref={qrRef} className="flex justify-center mb-5">
            {isLoading ? (
              <div className="w-52 h-52 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="p-4 bg-white rounded-xl border-2 border-green-200 shadow-soft inline-block">
                <QRCodeCanvas
                  value={qrValue}
                  size={200}
                  level="H"
                  marginSize={1}
                  fgColor="#111827"
                />
              </div>
            )}
          </div>

          {/* Doctor code */}
          {doctorCode ? (
            <div className="bg-green-50 rounded-full py-2 px-5 inline-block border border-green-100">
              <p className="text-[11px] text-green-700 uppercase tracking-wider font-medium">
                Clinic Code
              </p>
              <p className="text-base font-bold text-green-800 tracking-widest">
                {doctorCode}
              </p>
            </div>
          ) : (
            <p className="text-xs text-text-secondary italic">Clinic code not generated yet</p>
          )}
        </motion.div>

        {/* Share link */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 border border-gray-100 shadow-soft mb-4"
        >
          <p className="text-xs text-text-secondary mb-2">Your clinic WhatsApp link</p>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
            <p className="flex-1 text-sm text-text-primary truncate font-mono text-left">
              {shareUrl}
            </p>
            <button
              onClick={handleCopy}
              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center bg-white rounded-lg border border-gray-200"
              aria-label="Copy link"
            >
              <Copy size={14} className="text-brand-600" />
            </button>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-3 mb-4"
        >
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#25D366] text-white font-semibold rounded-xl text-sm min-h-[48px]"
          >
            <Share2 size={16} />
            Share Link
          </button>
          <button
            onClick={handleDownloadPoster}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white text-brand-600 font-semibold rounded-xl text-sm min-h-[48px] border border-brand-200"
          >
            <Download size={16} />
            Print Poster
          </button>
        </motion.div>

        <p className="text-xs text-text-secondary leading-relaxed">
          Print the poster and stick it at your reception. Patients scan the QR to open WhatsApp chat directly with your clinic code.
        </p>
      </div>

      {/* Hidden poster for html2canvas capture */}
      <div
        ref={posterRef}
        style={{
          display: "none",
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: 540,
          fontFamily: "'Plus Jakarta Sans', 'Helvetica Neue', Arial, sans-serif",
          background: "#f0f0f5",
          padding: 24,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: 28,
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
          }}
        >
          {/* White top section */}
          <div style={{ padding: "40px 32px 32px", textAlign: "center" }}>
            {/* Logo + brand */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-192.svg" alt="" width={44} height={44} style={{ borderRadius: 12 }} />
              <span style={{ fontSize: 32, fontWeight: 800, color: "#0d9488", letterSpacing: "-0.02em" }}>
                DrCliniq
              </span>
            </div>

            {/* Scan text */}
            <p style={{ fontSize: 18, color: "#6b7280", margin: "0 0 4px", fontWeight: 500 }}>
              Scan to chat on
            </p>
            <p style={{ fontSize: 26, fontWeight: 700, color: "#25D366", margin: "0 0 28px" }}>
              WhatsApp 📱
            </p>

            {/* QR code */}
            <div style={{ display: "inline-block", padding: 16, border: "3px solid #bbf7d0", borderRadius: 16, background: "#fff" }}>
              <QRCodeCanvas
                value={qrValue}
                size={320}
                level="H"
                marginSize={1}
                fgColor="#111827"
              />
            </div>

            {/* Clinic code */}
            {doctorCode && (
              <div style={{ marginTop: 24 }}>
                <div
                  style={{
                    display: "inline-block",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 24,
                    padding: "8px 24px",
                  }}
                >
                  <p style={{ fontSize: 10, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: 0 }}>
                    Clinic Code
                  </p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: "#166534", letterSpacing: "0.1em", margin: 0 }}>
                    {doctorCode}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Blue bottom banner */}
          <div
            style={{
              background: "#4285F4",
              padding: "28px 32px 32px",
              color: "#ffffff",
            }}
          >
            {/* Doctor info */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                🩺
              </div>
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                  {doctorName.startsWith("Dr") ? doctorName : `Dr. ${doctorName}`}
                </p>
                {specialtyText && (
                  <p style={{ fontSize: 14, opacity: 0.8, margin: 0, marginTop: 2 }}>
                    {specialtyText}
                  </p>
                )}
              </div>
            </div>

            {/* Separator */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.2)", margin: "0 0 16px" }} />

            {/* Clinic details */}
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>{clinicName}</p>
            {addressParts && (
              <p style={{ fontSize: 13, opacity: 0.85, margin: "0 0 5px" }}>📍 {addressParts}</p>
            )}
            {doctor.clinicPhone && (
              <p style={{ fontSize: 13, opacity: 0.85, margin: "0 0 5px" }}>📞 {doctor.clinicPhone}</p>
            )}
            {timingText && (
              <p style={{ fontSize: 13, opacity: 0.85, margin: "0 0 5px" }}>🕐 {timingText}</p>
            )}

            {/* Powered by */}
            <p style={{ fontSize: 11, opacity: 0.4, textAlign: "center", marginTop: 20, margin: "20px 0 0" }}>
              Powered by DrCliniq
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
