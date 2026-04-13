"use client";

import Link from "next/link";
import { ChevronRight, User } from "lucide-react";
import type { Patient } from "@/lib/api";

/** Strip WhatsApp markdown (*bold*, _italic_, ~strike~) for plain-text previews */
function stripWhatsAppMarkdown(text: string): string {
  return text
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~([^~]+)~/g, "$1")
    .replace(/```[^`]*```/g, "")
    .trim();
}

function formatTime(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).replace(/\s?am/i, " AM").replace(/\s?pm/i, " PM");
}

export default function PatientListItem({ patient }: { patient: Patient }) {
  const preview = stripWhatsAppMarkdown(patient.lastMessage ?? "");

  return (
    <Link
      href={`/patients/${patient.id}`}
      className="card-hover flex items-center gap-3 p-4 animate-fade-in"
    >
      {/* Avatar — urgent ring, no redundant dot icon */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            patient.isUrgent
              ? "bg-gradient-to-br from-red-100 to-red-200 ring-2 ring-urgent ring-offset-2"
              : "bg-gradient-to-br from-brand-100 to-brand-200"
          }`}
        >
          <User size={20} className={patient.isUrgent ? "text-urgent" : "text-brand-600"} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`text-sm truncate ${
              patient.unreadCount > 0
                ? "font-semibold text-slate-950"
                : "font-medium text-slate-800"
            }`}
          >
            {patient.name ?? patient.phone}
          </h3>
          <span className="text-[11px] text-slate-500 flex-shrink-0 tabular-nums">
            {formatTime(patient.lastMessageTime)}
          </span>
        </div>

        <p
          className={`text-xs mt-0.5 truncate ${
            patient.unreadCount > 0 ? "text-slate-700" : "text-slate-500"
          }`}
        >
          {preview}
        </p>

        {/* Status badges */}
        {patient.isUrgent && (
          <div className="mt-1.5">
            <span className="badge-urgent text-[10px]">Urgent</span>
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        {patient.unreadCount > 0 && (
          <div className="w-5 h-5 bg-brand-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
            {patient.unreadCount}
          </div>
        )}
        <ChevronRight size={14} className="text-slate-400" />
      </div>
    </Link>
  );
}
