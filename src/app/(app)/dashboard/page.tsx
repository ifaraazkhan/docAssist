"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle,
  MessageSquare,
  Clock,
  MailOpen,
  Zap,
  Activity,
} from "lucide-react";
import Header from "@/components/Header";
import PatientListItem from "@/components/PatientListItem";
import StatCard from "@/components/StatCard";
import { getPatients, type Patient } from "@/lib/api";
import { getDoctor } from "@/lib/auth";

type FilterType = "all" | "urgent" | "unread";

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const doctor = getDoctor();

  useEffect(() => {
    if (!doctor) return;
    getPatients(doctor.id)
      .then(setPatients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [doctor?.id]);

  const filteredPatients = patients.filter((p) => {
    if (activeFilter === "urgent") return p.isUrgent;
    if (activeFilter === "unread") return p.unreadCount > 0;
    return true;
  });

  const urgentCount = patients.filter((p) => p.isUrgent).length;
  const unreadCount = patients.filter((p) => p.unreadCount > 0).length;

  const filters: { key: FilterType; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "all", label: "Recent", icon: <Clock size={14} /> },
    { key: "urgent", label: "Urgent", icon: <AlertCircle size={14} />, count: urgentCount },
    { key: "unread", label: "Unread", icon: <MailOpen size={14} />, count: unreadCount },
  ];

  return (
    <>
      <Header
        title={`Hi, ${doctor?.name?.replace("Dr.", "").trim().split(" ")[0] ?? "Doctor"}`}
        subtitle={doctor?.clinicName ?? ""}
        rightAction={
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 rounded-lg border border-brand-100">
            <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse-soft" />
            <span className="text-[10px] font-semibold text-brand-700 uppercase tracking-wider">
              Pro
            </span>
          </div>
        }
      />

      <div className="page-container">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in">
          <StatCard
            label="Patients via bot"
            value={patients.length > 0 ? patients.length : "—"}
            icon={<Zap size={18} />}
            accent="brand"
          />
          <StatCard
            label="Needs your attention"
            value={urgentCount}
            icon={<AlertCircle size={18} />}
            accent="urgent"
          />
        </div>

        {/* Quick insight bar */}
        <div className="card p-3 mb-6 flex items-center gap-3 animate-fade-in stagger-2">
          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Activity size={16} className="text-slate-500" />
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {urgentCount > 0 ? (
              <>
                <span className="text-urgent-text font-semibold">{urgentCount} patient{urgentCount > 1 ? "s" : ""}</span>
                {" "}need{urgentCount === 1 ? "s" : ""} your personal reply.{" "}
                <span className="text-slate-500">Open the chat and tap <strong>Mark Resolved</strong> once done.</span>
              </>
            ) : patients.length > 0 ? (
              <>
                All <span className="font-semibold text-slate-900">{patients.length}</span> chats
                {" "}reviewed — you&apos;re all caught up!
              </>
            ) : (
              <>No patient messages yet.</>
            )}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 animate-fade-in stagger-3">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex items-center gap-1.5 px-3.5 min-h-[44px] rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeFilter === filter.key
                  ? filter.key === "urgent"
                    ? "bg-urgent-bg text-urgent-text shadow-soft border border-red-100"
                    : "bg-brand-50 text-brand-700 shadow-soft border border-brand-100"
                  : "bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {filter.icon}
              {filter.label}
              {filter.count !== undefined && filter.count > 0 && (
                <span
                  className={`ml-0.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    activeFilter === filter.key
                      ? filter.key === "urgent"
                        ? "bg-urgent text-white"
                        : "bg-brand-500 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Patient list */}
        <div className="space-y-2">
          {loading ? (
            <div className="card p-8 text-center animate-fade-in">
              <p className="text-sm text-slate-400">Loading patients...</p>
            </div>
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((patient, i) => (
              <div key={patient.id} className={`stagger-${Math.min(i + 1, 6)}`}>
                <PatientListItem patient={patient} />
              </div>
            ))
          ) : (
            <div className="card p-8 text-center animate-fade-in">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageSquare size={20} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {patients.length === 0 ? "No patients yet" : "No messages in this category"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {patients.length === 0
                  ? "Patients will appear here when they message your WhatsApp number"
                  : "All caught up!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
