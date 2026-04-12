"use client";

import Link from "next/link";
import { AlertCircle, ChevronRight, User } from "lucide-react";
import type { Patient } from "@/lib/api";

export default function PatientListItem({ patient }: { patient: Patient }) {
  return (
    <Link
      href={`/patients/${patient.id}`}
      className="card-hover flex items-center gap-3 p-4 animate-fade-in"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
          <User size={20} className="text-brand-600" />
        </div>
        {patient.isUrgent && (
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-urgent rounded-full border-2 border-white flex items-center justify-center animate-pulse-soft">
            <AlertCircle size={10} className="text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`text-sm truncate ${
              patient.unreadCount > 0
                ? "font-semibold text-slate-900"
                : "font-medium text-slate-700"
            }`}
          >
            {patient.name ?? patient.phone}
          </h3>
          <span className="text-[11px] text-slate-400 flex-shrink-0">
            {new Date(patient.lastMessageTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <p
          className={`text-xs mt-0.5 truncate ${
            patient.unreadCount > 0 ? "text-slate-600" : "text-slate-400"
          }`}
        >
          {patient.lastMessage}
        </p>

        {/* Bottom row */}
        <div className="flex items-center gap-2 mt-1.5">
          {patient.isUrgent && (
            <span className="badge-urgent text-[10px]">Urgent</span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        {patient.unreadCount > 0 && (
          <div className="w-5 h-5 bg-brand-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
            {patient.unreadCount}
          </div>
        )}
        <ChevronRight size={14} className="text-slate-300" />
      </div>
    </Link>
  );
}
