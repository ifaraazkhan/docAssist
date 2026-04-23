"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import useSWR from "swr";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Search,
  Bell,
  Plus,
  QrCode,
  MessageSquare,
  FileText,
  Users,
  BarChart3,
  LayoutGrid,
  Sparkles,
  Newspaper,
} from "lucide-react";
import { getPatients, type Patient } from "@/lib/api";
import { useDoctor } from "@/lib/doctor-context";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/cn";
import { formatDistanceToNow } from "date-fns";

type FilterType = "all" | "urgent" | "unread";

const AVATAR_COLORS = [
  "from-indigo-400 to-indigo-500",
  "from-amber-400 to-amber-500",
  "from-teal-400 to-teal-500",
  "from-rose-400 to-rose-500",
  "from-violet-400 to-violet-500",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getInitial(name: string | null) {
  return name ? name.charAt(0).toUpperCase() : "?";
}

function getAvatarColor(id: string, isUrgent: boolean) {
  if (isUrgent) return "from-red-400 to-red-500";
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function relativeTime(dateStr: string | null) {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: false });
  } catch {
    return "";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const doctor = useDoctor();
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useSWR(
    ["patients", filter],
    () => getPatients(filter === "all" ? undefined : filter),
    { revalidateOnFocus: true }
  );

  const patients = data?.patients ?? [];

  const filteredPatients = searchQuery
    ? patients.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.phone.includes(searchQuery)
      )
    : patients;

  const firstName = doctor.name?.replace("Dr.", "").trim().split(" ")[0] ?? "Doctor";

  const urgentCount = patients.filter((p) => p.isUrgent).length;
  const unreadCount = patients.filter((p) => p.unreadCount > 0).length;

  const tabs: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "All", count: patients.length },
    { key: "urgent", label: "Urgent", count: urgentCount },
    { key: "unread", label: "Unread", count: unreadCount },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            {getGreeting()}, Dr. {firstName}
          </h1>
          <p className="text-sm text-text-secondary">{doctor.clinicName}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              tap();
              setSearchOpen(!searchOpen);
            }}
            className="p-2.5 rounded-xl text-text-secondary min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Search patients"
          >
            <Search size={20} />
          </button>
          <button
            className="relative p-2.5 rounded-xl text-text-secondary min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-urgent rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="mb-4"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or phone..."
            className="input-field"
            autoFocus
            aria-label="Search patients"
          />
        </motion.div>
      )}

      {/* Quick Actions — horizontal scroll cards */}
      <div className="mb-5 -mx-4">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-[15px] font-bold text-text-primary tracking-tight">Quick Actions</h2>
        </div>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 snap-x snap-mandatory">
          {[
            {
              icon: <LayoutGrid size={18} />,
              title: "Manage Menu",
              desc: "WhatsApp buttons",
              bg: "bg-gradient-to-br from-blue-100 to-blue-200",
              color: "text-blue-600",
              href: "/protocols",
            },
            {
              icon: <Plus size={18} />,
              title: "New Protocol",
              desc: "Create auto-reply",
              bg: "bg-gradient-to-br from-violet-100 to-violet-200",
              color: "text-violet-600",
              href: "/protocols/new",
            },
            {
              icon: <QrCode size={18} />,
              title: "Share QR",
              desc: "Clinic WhatsApp link",
              bg: "bg-gradient-to-br from-teal-100 to-teal-200",
              color: "text-teal-600",
              href: "/settings/share",
            },
            {
              icon: <BarChart3 size={18} />,
              title: "Analytics",
              desc: "Bot performance",
              bg: "bg-gradient-to-br from-pink-100 to-pink-200",
              color: "text-pink-600",
              href: "/settings",
            },
            {
              icon: <Sparkles size={18} />,
              title: "AI Features",
              desc: "Smart assistance",
              bg: "bg-gradient-to-br from-amber-100 to-amber-200",
              color: "text-amber-600",
              href: "/settings",
            },
            {
              icon: <Newspaper size={18} />,
              title: "News & Updates",
              desc: "What\u2019s new",
              bg: "bg-gradient-to-br from-green-100 to-green-200",
              color: "text-green-600",
              href: "/settings",
            },
          ].map((action, i) => (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => {
                tap();
                router.push(action.href);
              }}
              className="min-w-[130px] flex-shrink-0 snap-start flex flex-col gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-soft active:scale-[0.97] transition-transform"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", action.bg, action.color)}>
                {action.icon}
              </div>
              <div className="text-left">
                <p className="text-[13px] font-bold text-text-primary leading-tight">{action.title}</p>
                <p className="text-[10px] text-text-secondary mt-0.5">{action.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Stat tabs */}
      <div className="stat-tabs mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              tap();
              setFilter(t.key);
            }}
            className={cn("stat-tab", filter === t.key && "active")}
          >
            {t.label}
            <span className="text-xs opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Patient list */}
      <div>
        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="patient-row">
                <Skeleton circle width={44} height={44} />
                <div className="flex-1">
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="80%" height={12} style={{ marginTop: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPatients.length > 0 ? (
          filteredPatients.map((patient, i) => (
            <motion.button
              key={patient.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => {
                tap();
                router.push(`/patients/${patient.id}`);
              }}
              className="patient-row w-full text-left"
            >
              {/* Avatar */}
              <div
                className={cn(
                  "w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm flex-shrink-0",
                  getAvatarColor(patient.id, patient.isUrgent)
                )}
              >
                {getInitial(patient.name)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-text-primary truncate">
                    {patient.name || patient.phone}
                  </span>
                  <span className="text-[11px] text-text-secondary whitespace-nowrap flex-shrink-0">
                    {relativeTime(patient.lastMessageTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-xs text-text-secondary truncate">
                    {patient.lastMessage || "No messages"}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {patient.isUrgent && (
                      <span className="badge badge-urgent text-[11px]">Urgent</span>
                    )}
                    {patient.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center">
                        {patient.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={24} className="text-gray-400" />
            </div>
            <p className="font-semibold text-sm text-text-primary mb-1">
              {patients.length === 0 ? "No patients yet" : "No results"}
            </p>
            <p className="text-xs text-text-secondary max-w-xs mx-auto mb-4">
              {patients.length === 0
                ? "Share your clinic QR code to get started"
                : "Try a different search or filter"}
            </p>
            {patients.length === 0 && (
              <button
                onClick={() => router.push("/settings/share")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white font-semibold rounded-xl text-sm min-h-[44px]"
              >
                <QrCode size={16} />
                Share Clinic QR
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
