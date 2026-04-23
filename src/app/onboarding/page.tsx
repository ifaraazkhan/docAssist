"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { getOnboardingStatus, confirmProfile, selectProtocols, getLibraryProtocols, getSpecialties } from "@/lib/api";
import type { LibraryProtocol } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { success as hapticSuccess, toggle as hapticToggle } from "@/lib/haptics";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Step = "profile" | "protocols" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile fields
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [clinicName, setClinicName] = useState("");
  const [city, setCity] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicHoursStart, setClinicHoursStart] = useState("09:00");
  const [clinicHoursEnd, setClinicHoursEnd] = useState("18:00");
  const [activeDays, setActiveDays] = useState<boolean[]>([true, true, true, true, true, true, false]);

  // Protocol selection
  const [libraryProtocols, setLibraryProtocols] = useState<LibraryProtocol[]>([]);
  const [selectedProtocols, setSelectedProtocols] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/");
      return;
    }

    getOnboardingStatus()
      .then((res) => {
        if (res.onboardingComplete) {
          router.replace("/dashboard");
          return;
        }
        const p = res.profileData;
        if (p.name) setName(p.name);
        if (p.specialty) setSpecialty(p.specialty);
        if (p.clinicName) setClinicName(p.clinicName);
        if (p.city) setCity(p.city);
        if (p.clinicAddress) setClinicAddress(p.clinicAddress);
        if (p.clinicPhone) setClinicPhone(p.clinicPhone);
        if (p.clinicHoursStart) setClinicHoursStart(p.clinicHoursStart);
        if (p.clinicHoursEnd) setClinicHoursEnd(p.clinicHoursEnd);
        setLoading(false);
      })
      .catch(() => {
        router.replace("/");
      });

    getSpecialties()
      .then((res) => setSpecialties(res.specialties))
      .catch(() => {});
  }, [router]);

  const handleConfirmProfile = async () => {
    if (!name.trim() || !specialty.trim() || !clinicName.trim()) return;
    setSaving(true);
    try {
      await confirmProfile({
        name: name.trim(),
        specialty: specialty.trim(),
        clinicName: clinicName.trim(),
        city: city.trim() || undefined,
        clinicAddress: clinicAddress.trim() || undefined,
        clinicPhone: clinicPhone.trim() || undefined,
        clinicHoursStart,
        clinicHoursEnd,
      });
      hapticSuccess();

      // Load library protocols for selection
      const libRes = await getLibraryProtocols(specialty);
      setLibraryProtocols(libRes.protocols.slice(0, 6));
      setStep("protocols");
    } catch {
      // Error handled by API layer
    } finally {
      setSaving(false);
    }
  };

  const handleSelectProtocols = async () => {
    setSaving(true);
    try {
      await selectProtocols(Array.from(selectedProtocols));
      hapticSuccess();
      setStep("done");
      setTimeout(() => router.replace("/dashboard"), 1500);
    } catch {
      // Error handled by API layer
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (index: number) => {
    hapticToggle();
    setActiveDays((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const toggleProtocol = (id: string) => {
    hapticToggle();
    setSelectedProtocols((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <div className="page-container max-w-sm mx-auto" style={{ paddingBottom: "2rem" }}>
        {/* ── Profile Step ── */}
        {step === "profile" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold text-text-primary mt-8 mb-1">
              Welcome to DrCliniq
            </h1>
            <p className="text-sm text-text-secondary mb-6">
              Confirm your details to get started
            </p>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Priya Sharma"
                  className="input-field"
                />
              </div>

              {/* Specialty */}
              <div className="relative">
                <label className="text-sm font-medium text-text-primary mb-1.5 block">
                  Specialty *
                </label>
                <button
                  type="button"
                  onClick={() => setShowSpecialtyDropdown(!showSpecialtyDropdown)}
                  className="input-field text-left flex items-center justify-between"
                >
                  <span className={specialty ? "text-text-primary" : "text-text-secondary"}>
                    {specialty || "Select specialty"}
                  </span>
                  <span className="text-text-secondary">▾</span>
                </button>
                {showSpecialtyDropdown && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-elevated border border-gray-100 max-h-48 overflow-y-auto">
                    {specialties.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSpecialty(s);
                          setShowSpecialtyDropdown(false);
                          hapticToggle();
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors min-h-[44px]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clinic Name */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">
                  Clinic Name *
                </label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Sharma Clinic"
                  className="input-field"
                />
              </div>

              {/* City */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai"
                  className="input-field"
                />
              </div>

              {/* Address */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">
                  Clinic Address
                </label>
                <textarea
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  placeholder="123 MG Road, Andheri West"
                  className="input-field resize-none"
                  rows={2}
                />
              </div>

              {/* Clinic Phone */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">
                  Clinic Phone
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value)}
                  placeholder="022-12345678"
                  className="input-field"
                />
              </div>

              {/* Clinic Hours */}
              <div>
                <label className="text-sm font-medium text-text-primary mb-3 block">
                  Clinic Hours
                </label>

                {/* Day toggles */}
                <div className="flex gap-1.5 mb-4">
                  {DAYS.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[40px] ${
                        activeDays[i]
                          ? "bg-brand-500 text-white"
                          : "bg-gray-100 text-text-secondary"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {/* Time inputs */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-text-secondary mb-1 block">Start</label>
                    <input
                      type="time"
                      value={clinicHoursStart}
                      onChange={(e) => setClinicHoursStart(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                  <span className="text-text-secondary mt-5">to</span>
                  <div className="flex-1">
                    <label className="text-xs text-text-secondary mb-1 block">End</label>
                    <input
                      type="time"
                      value={clinicHoursEnd}
                      onChange={(e) => setClinicHoursEnd(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirmProfile}
                disabled={saving || !name.trim() || !specialty.trim() || !clinicName.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-brand-500 text-white font-semibold rounded-xl text-sm min-h-[48px] disabled:opacity-50 mt-6"
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Confirm & Continue"
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Protocol Selection Step ── */}
        {step === "protocols" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold text-text-primary mt-8 mb-1">
              Add Protocols
            </h1>
            <p className="text-sm text-text-secondary mb-6">
              Auto-reply templates for common patient queries. You can add more later.
            </p>

            <div className="space-y-3">
              {libraryProtocols.map((proto, i) => (
                <motion.button
                  key={proto.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => toggleProtocol(proto.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selectedProtocols.has(proto.id)
                      ? "border-brand-500 bg-brand-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-text-primary">{proto.title}</p>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                        {proto.replyText}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 mt-0.5 ${
                        selectedProtocols.has(proto.id)
                          ? "border-brand-500 bg-brand-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedProtocols.has(proto.id) && (
                        <CheckCircle size={12} className="text-white" />
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {libraryProtocols.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-text-secondary">
                  No protocols available for your specialty yet.
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleSelectProtocols()}
                className="flex-1 px-4 py-3.5 text-sm font-medium text-text-secondary bg-gray-100 rounded-xl min-h-[48px]"
              >
                Skip for now
              </button>
              <button
                onClick={handleSelectProtocols}
                disabled={saving || selectedProtocols.size === 0}
                className="flex-1 flex items-center justify-center px-4 py-3.5 bg-brand-500 text-white font-semibold rounded-xl text-sm min-h-[48px] disabled:opacity-50"
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  `Add ${selectedProtocols.size > 0 ? `(${selectedProtocols.size})` : ""}`
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Done ── */}
        {step === "done" && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[60dvh]"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">You&apos;re all set!</h2>
            <p className="text-sm text-text-secondary">Taking you to your inbox...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
