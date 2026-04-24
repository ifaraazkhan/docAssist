"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Drawer } from "vaul";
import { toast } from "sonner";
import useSWR from "swr";
import {
  User,
  Building2,
  Phone,
  MapPin,
  Clock,
  Calendar,
  MessageCircle,
  QrCode,
  Share2,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Crown,
  Pencil,
  Save,
  AlertTriangle,
  Sparkles,
  Check,
  Zap,
  Mail,
} from "lucide-react";
import { useDoctor } from "@/lib/doctor-context";
import { updateDoctorProfile, logoutAll, getSpecialties, createPaymentOrder, verifyPayment } from "@/lib/api";
import { clearSession, saveDoctor } from "@/lib/auth";
import { tap, success as hapticSuccess, error as hapticError } from "@/lib/haptics";
import { cn } from "@/lib/cn";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PLANS = {
  free: {
    label: "Free",
    price: "₹0",
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    features: ["5 protocols", "50 patients/month", "Basic auto-replies"],
  },
  pro: {
    label: "Pro",
    price: "₹999",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    features: ["Unlimited protocols", "Unlimited patients", "Priority support", "Custom replies", "Analytics"],
  },
  clinic_plus: {
    label: "Clinic+",
    price: "₹2,499",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    features: ["Everything in Pro", "Multi-doctor support", "Appointment booking", "Dedicated account manager"],
  },
} as const;

type PlanKey = keyof typeof PLANS;

export default function SettingsPage() {
  const router = useRouter();
  const doctor = useDoctor();

  const { data: specData } = useSWR("specialties", () => getSpecialties());
  const specialties = specData?.specialties ?? [];

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(doctor.name ?? "");
  const [email, setEmail] = useState(doctor.email ?? "");
  const [specialty, setSpecialty] = useState(doctor.specialty ?? "");
  const [clinicName, setClinicName] = useState(doctor.clinicName ?? "");
  const [city, setCity] = useState(doctor.city ?? "");
  const [clinicAddress, setClinicAddress] = useState(doctor.clinicAddress ?? "");
  const [clinicPhone, setClinicPhone] = useState(doctor.clinicPhone ?? "");
  const [clinicHoursStart, setClinicHoursStart] = useState(doctor.clinicHoursStart ?? "09:00");
  const [clinicHoursEnd, setClinicHoursEnd] = useState(doctor.clinicHoursEnd ?? "18:00");
  const [clinicDays, setClinicDays] = useState(doctor.clinicDays ?? "1111110");
  const [clinicClosed, setClinicClosed] = useState(doctor.clinicClosed ?? false);
  const [clinicClosedMessage, setClinicClosedMessage] = useState(
    doctor.clinicClosedMessage ?? "Our clinic is temporarily closed. We will resume soon."
  );
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [showPlanDrawer, setShowPlanDrawer] = useState(false);

  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    if (document.getElementById("razorpay-script")) return;
    const s = document.createElement("script");
    s.id = "razorpay-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const currentPlan = (doctor.plan ?? "free") as PlanKey;
  const currentPlanInfo = PLANS[currentPlan] ?? PLANS.free;

  const handleUpgrade = useCallback(async (plan: "pro" | "clinic_plus") => {
    tap();
    setUpgrading(plan);
    try {
      const order = await createPaymentOrder(plan);

      const win = window as Window & { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void } };
      if (!win.Razorpay) {
        toast.error("Payment gateway loading, try again");
        setUpgrading(null);
        return;
      }

      const rz = new win.Razorpay({
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: "DrCliniq",
        description: `Upgrade to ${PLANS[plan].label}`,
        order_id: order.orderId,
        prefill: {
          contact: doctor.phone,
          email: doctor.email ?? "",
        },
        theme: { color: "#0d9488" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            hapticSuccess();
            toast.success(`Upgraded to ${PLANS[plan].label}!`);
            setShowPlanDrawer(false);
            window.location.reload();
          } catch {
            toast.error("Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => setUpgrading(null),
        },
      });
      rz.open();
    } catch {
      // Error handled by API layer
    } finally {
      setUpgrading(null);
    }
  }, [doctor.phone, doctor.email]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await updateDoctorProfile({
        name: name.trim(),
        email: email.trim() || null,
        specialty: specialty.trim() || null,
        clinicName: clinicName.trim() || null,
        city: city.trim() || null,
        clinicAddress: clinicAddress.trim() || null,
        clinicPhone: clinicPhone.trim() || null,
        clinicHoursStart,
        clinicHoursEnd,
        clinicDays,
        clinicClosed,
        clinicClosedMessage: clinicClosed ? clinicClosedMessage.trim() : null,
      } as Parameters<typeof updateDoctorProfile>[0]);
      saveDoctor(res.doctor);
      hapticSuccess();
      toast("Profile updated");
      setEditing(false);
      // Force page to re-read doctor from context — just reload
      window.location.reload();
    } catch {
      // Error handled by API layer
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutAll();
    } catch {
      // Logout even if API fails
    }
    hapticError();
    clearSession();
    window.location.href = "/";
  };

  const planLabel = currentPlanInfo.label;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
      </div>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-5 border border-gray-100 shadow-soft mb-5"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center flex-shrink-0">
            <User size={24} className="text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg text-text-primary">{doctor.name}</h2>
            <p className="text-xs text-text-secondary mt-0.5">{doctor.specialty ?? "Doctor"}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Crown size={12} className="text-amber-500" />
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                {planLabel} Plan
              </span>
            </div>
          </div>
          <button
            onClick={() => { tap(); setEditing(!editing); }}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-gray-50"
            aria-label="Edit profile"
          >
            <Pencil size={16} className="text-text-secondary" />
          </button>
        </div>
      </motion.div>

      {/* Editable profile section */}
      {editing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white rounded-xl p-5 border border-gray-100 shadow-soft mb-5 space-y-4"
        >
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">
              <span className="flex items-center gap-1.5"><Mail size={12} /> Email</span>
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="doctor@clinic.com" className="input-field" />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Specialty</label>
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="input-field">
              <option value="">Select specialty</option>
              {specialties.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Clinic Name</label>
            <input value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">Clinic Phone</label>
              <input value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">Clinic Address</label>
            <input value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} className="input-field" />
          </div>

          {/* Clinic hours */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
              <Clock size={12} /> Clinic Hours
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-text-secondary">Opens</span>
                <input
                  type="time"
                  value={clinicHoursStart}
                  onChange={(e) => setClinicHoursStart(e.target.value)}
                  className="input-field mt-1"
                />
              </div>
              <div>
                <span className="text-[11px] text-text-secondary">Closes</span>
                <input
                  type="time"
                  value={clinicHoursEnd}
                  onChange={(e) => setClinicHoursEnd(e.target.value)}
                  className="input-field mt-1"
                />
              </div>
            </div>
          </div>

          {/* Clinic days */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-2 flex items-center gap-1.5">
              <Calendar size={12} /> Open Days
            </label>
            <div className="flex gap-1.5">
              {DAYS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    tap();
                    const arr = clinicDays.split("");
                    arr[i] = arr[i] === "1" ? "0" : "1";
                    setClinicDays(arr.join(""));
                  }}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-medium min-h-[36px] border transition-colors",
                    clinicDays[i] === "1"
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-gray-50 text-text-secondary border-gray-200"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Temporarily closed */}
          <div className={cn(
            "rounded-xl p-4 border transition-colors",
            clinicClosed ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"
          )}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className={clinicClosed ? "text-red-500" : "text-text-secondary"} />
                <span className="text-sm font-medium text-text-primary">Temporarily Closed</span>
              </div>
              <button
                type="button"
                onClick={() => { tap(); setClinicClosed(!clinicClosed); }}
                role="switch"
                aria-checked={clinicClosed}
                className={cn(
                  "w-11 h-[26px] rounded-full transition-colors relative flex-shrink-0",
                  clinicClosed ? "bg-red-500" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow transition-transform",
                    clinicClosed ? "translate-x-[18px]" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            <p className="text-[11px] text-text-secondary">
              Patients will see this in the Clinic Details reply on WhatsApp
            </p>
            {clinicClosed && (
              <textarea
                value={clinicClosedMessage}
                onChange={(e) => setClinicClosedMessage(e.target.value)}
                placeholder="Reason for closure..."
                rows={2}
                className="input-field mt-3 text-sm"
              />
            )}
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving || !name.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-500 text-white font-semibold rounded-xl text-sm min-h-[48px] disabled:opacity-50"
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Save size={16} /> Save Profile</>
            )}
          </button>
        </motion.div>
      )}

      {/* Clinic info (read-only when not editing) */}
      {!editing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-gray-100 shadow-soft mb-5 divide-y divide-gray-50"
        >
          <InfoRow icon={<Building2 size={15} />} label="Clinic" value={doctor.clinicName ?? "—"} />
          <InfoRow
            icon={<MapPin size={15} />}
            label="Address"
            value={
              [doctor.clinicAddress, doctor.city].filter(Boolean).join(", ") || "—"
            }
          />
          <InfoRow icon={<Phone size={15} />} label="Phone" value={doctor.clinicPhone ?? doctor.phone} />
          <InfoRow
            icon={<Clock size={15} />}
            label="Hours"
            value={
              doctor.clinicHoursStart && doctor.clinicHoursEnd
                ? `${doctor.clinicHoursStart} – ${doctor.clinicHoursEnd}`
                : "Not set"
            }
          />
          <InfoRow
            icon={<Calendar size={15} />}
            label="Days"
            value={
              doctor.clinicDays
                ? DAYS.filter((_, i) => doctor.clinicDays?.[i] === "1").join(", ") || "None"
                : "Not set"
            }
          />
          {doctor.clinicClosed && (
            <div className="px-4 py-3 flex items-center gap-3">
              <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-red-600 font-medium">Temporarily Closed</p>
                {doctor.clinicClosedMessage && (
                  <p className="text-[11px] text-text-secondary mt-0.5">{doctor.clinicClosedMessage}</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* WhatsApp status */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-4 border border-gray-100 shadow-soft mb-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <MessageCircle size={18} className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">WhatsApp Business</p>
            <div className="flex items-center gap-1 mt-0.5">
              {doctor.whatsappConnected ? (
                <>
                  <CheckCircle2 size={10} className="text-green-500" />
                  <span className="text-[11px] text-green-600 font-medium">Connected</span>
                </>
              ) : (
                <span className="text-[11px] text-text-secondary">Not connected</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Plan details */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className={cn(
          "rounded-xl p-4 border shadow-soft mb-5",
          currentPlanInfo.bg, currentPlanInfo.border
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              currentPlan === "free" ? "bg-gray-100" : currentPlan === "pro" ? "bg-amber-100" : "bg-violet-100"
            )}>
              <Crown size={18} className={currentPlanInfo.color} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className={cn("text-sm font-bold", currentPlanInfo.color)}>{planLabel} Plan</p>
                <span className="text-xs text-text-secondary">{currentPlanInfo.price}/mo</span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {currentPlanInfo.features.slice(0, 3).map((f) => (
                  <span key={f} className="text-[11px] text-text-secondary flex items-center gap-1">
                    <Check size={10} className="text-green-500" /> {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        {currentPlan !== "clinic_plus" && (
          <button
            onClick={() => { tap(); setShowPlanDrawer(true); }}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl text-sm min-h-[44px]"
          >
            <Sparkles size={14} />
            {currentPlan === "free" ? "Upgrade Plan" : "Upgrade to Clinic+"}
          </button>
        )}
      </motion.div>

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-xl border border-gray-100 shadow-soft mb-5 divide-y divide-gray-50"
      >
        <button
          onClick={() => { tap(); router.push("/settings/share"); }}
          className="w-full flex items-center gap-3 px-4 py-3.5"
        >
          <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <QrCode size={15} className="text-brand-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-text-primary">Share Clinic QR</p>
            <p className="text-[11px] text-text-secondary mt-0.5">Patients scan to start WhatsApp chat</p>
          </div>
          <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
        </button>
        <button
          onClick={() => { tap(); router.push("/settings/refer"); }}
          className="w-full flex items-center gap-3 px-4 py-3.5"
        >
          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Share2 size={15} className="text-violet-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-text-primary">Refer a Doctor</p>
            <p className="text-[11px] text-text-secondary mt-0.5">Share DrCliniq with colleagues</p>
          </div>
          <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
        </button>
      </motion.div>

      {/* Sign out */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <button
          onClick={() => setShowLogout(true)}
          className="w-full bg-white rounded-xl p-4 border border-gray-100 shadow-soft flex items-center gap-3 text-left"
        >
          <LogOut size={16} className="text-urgent" />
          <span className="text-sm font-medium text-urgent">Sign Out</span>
        </button>
      </motion.div>

      {/* Plan comparison drawer */}
      <Drawer.Root open={showPlanDrawer} onOpenChange={setShowPlanDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[85dvh] overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-3" />
            <div className="p-6">
              <h3 className="font-bold text-lg text-text-primary mb-1 text-center">Choose Your Plan</h3>
              <p className="text-sm text-text-secondary text-center mb-5">
                Upgrade to unlock more features
              </p>

              <div className="space-y-4">
                {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][])
                  .filter(([key]) => key !== 'free')
                  .map(([key, plan]) => {
                  const isCurrent = key === currentPlan;
                  const isDowngrade =
                    (currentPlan === "pro" && key === "free") ||
                    (currentPlan === "clinic_plus" && key !== "clinic_plus");
                  return (
                    <div
                      key={key}
                      className={cn(
                        "rounded-xl p-4 border-2 transition-colors",
                        isCurrent ? `${plan.border} ${plan.bg}` : "border-gray-100 bg-white"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Crown size={16} className={plan.color} />
                          <span className={cn("font-bold text-sm", plan.color)}>{plan.label}</span>
                          {isCurrent && (
                            <span className="text-[11px] bg-white/80 rounded-full px-2 py-0.5 font-medium text-text-secondary border border-gray-200">
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-base font-bold text-text-primary">
                          {plan.price}<span className="text-xs font-normal text-text-secondary">/mo</span>
                        </span>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        {plan.features.map((f) => (
                          <div key={f} className="flex items-center gap-2 text-sm text-text-primary">
                            <Check size={14} className="text-green-500 flex-shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                      {!isCurrent && !isDowngrade && (
                        <button
                          onClick={() => handleUpgrade(key as "pro" | "clinic_plus")}
                          disabled={upgrading !== null}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl text-sm min-h-[44px] disabled:opacity-50"
                        >
                          {upgrading === key ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <><Zap size={14} /> Upgrade to {plan.label}</>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Logout drawer */}
      <Drawer.Root open={showLogout} onOpenChange={setShowLogout}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-3" />
            <div className="p-6 text-center">
              <LogOut size={24} className="text-urgent mx-auto mb-3" />
              <h3 className="font-semibold text-text-primary mb-1">Sign out?</h3>
              <p className="text-sm text-text-secondary mb-6">
                You&apos;ll need to log in again on this device.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogout(false)}
                  className="flex-1 py-3 bg-gray-100 rounded-xl font-medium text-sm min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex-1 py-3 bg-urgent text-white rounded-xl font-semibold text-sm min-h-[48px] disabled:opacity-50"
                >
                  {loggingOut ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-text-secondary flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-text-secondary uppercase tracking-wider">{label}</p>
        <p className="text-sm text-text-primary truncate">{value}</p>
      </div>
    </div>
  );
}
