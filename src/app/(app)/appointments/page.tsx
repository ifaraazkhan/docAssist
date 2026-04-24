"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  CalendarCheck,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getAppointments, updateAppointment } from "@/lib/api";
import type { Appointment } from "@/lib/api";
import { cn } from "@/lib/cn";
import { tap, success as hapticSuccess } from "@/lib/haptics";
import { toast } from "sonner";

const STATUS_CONFIG = {
  booked: { label: "Booked", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  completed: { label: "Done", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
  no_show: { label: "No Show", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
} as const;

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(d: Date) {
  const today = new Date();
  const todayStr = formatDate(today);
  const dateStr = formatDate(d);

  if (dateStr === todayStr) return "Today";

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === formatDate(tomorrow)) return "Tomorrow";

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === formatDate(yesterday)) return "Yesterday";

  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = formatDate(selectedDate);

  const { data, isLoading, mutate } = useSWR(
    ["appointments", dateStr],
    () => getAppointments(dateStr)
  );

  const appointments = data?.appointments ?? [];

  // Group by session
  const grouped = appointments.reduce<Record<string, { sessionName: string; sessionStart: string; sessionEnd: string; items: Appointment[] }>>(
    (acc, appt) => {
      if (!acc[appt.sessionId]) {
        acc[appt.sessionId] = {
          sessionName: appt.sessionName,
          sessionStart: appt.sessionStart,
          sessionEnd: appt.sessionEnd,
          items: [],
        };
      }
      acc[appt.sessionId].items.push(appt);
      return acc;
    },
    {}
  );

  const sessions = Object.entries(grouped);
  const bookedCount = appointments.filter((a) => a.status === "booked").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  const handleStatusChange = useCallback(async (id: string, status: "completed" | "no_show") => {
    tap();
    mutate(
      (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          appointments: prev.appointments.map((a) =>
            a.id === id ? { ...a, status } : a
          ),
        };
      },
      false
    );
    try {
      await updateAppointment(id, { status });
      hapticSuccess();
      toast(status === "completed" ? "Marked as done" : "Marked as no-show");
    } catch {
      mutate();
    }
  }, [mutate]);

  const shiftDate = (days: number) => {
    tap();
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-text-primary">Appointments</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-brand-600 bg-brand-50 rounded-lg px-2.5 py-1">
            {bookedCount} pending · {completedCount} done
          </span>
        </div>
      </div>

      {/* Date picker */}
      <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100 shadow-soft mb-5">
        <button onClick={() => shiftDate(-1)} className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-gray-50">
          <ChevronLeft size={18} className="text-text-secondary" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-text-primary">{formatDisplayDate(selectedDate)}</p>
          <p className="text-[11px] text-text-secondary">{selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <button onClick={() => shiftDate(1)} className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-gray-50">
          <ChevronRight size={18} className="text-text-secondary" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height={72} borderRadius={12} />
              ))}
            </div>
          </motion.div>
        ) : sessions.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <CalendarCheck size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-text-secondary">No appointments for this day</p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {sessions.map(([sessionId, group]) => (
              <div key={sessionId}>
                {/* Session header */}
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-brand-600" />
                  <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
                    {group.sessionName}
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    {group.sessionStart}–{group.sessionEnd}
                  </span>
                  <span className="text-[11px] text-text-secondary ml-auto">
                    {group.items.filter((a) => a.status === "booked").length} pending
                  </span>
                </div>

                {/* Appointment cards */}
                <div className="space-y-2">
                  {group.items.map((appt, i) => {
                    const cfg = STATUS_CONFIG[appt.status];
                    const waitMin = (appt.tokenNumber - 1) * (appt.avgMinutes || 5);

                    return (
                      <motion.div
                        key={appt.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={cn(
                          "bg-white rounded-xl p-4 border shadow-soft",
                          appt.status === "booked" ? "border-blue-100" : "border-gray-100"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Token badge */}
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0",
                            appt.status === "booked" ? "bg-blue-50 text-blue-700" :
                            appt.status === "completed" ? "bg-green-50 text-green-700" :
                            "bg-gray-50 text-gray-400"
                          )}>
                            #{appt.tokenNumber}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-text-primary truncate">
                                {appt.patientName || "Patient"}
                              </p>
                              <span className={cn("text-[10px] font-medium rounded-full px-2 py-0.5", cfg.color)}>
                                {cfg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[11px] text-text-secondary flex items-center gap-1">
                                <Phone size={10} /> {appt.patientPhone}
                              </span>
                              {appt.status === "booked" && (
                                <span className="text-[11px] text-text-secondary">
                                  ~{waitMin} min wait
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          {appt.status === "booked" && (
                            <div className="flex gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => handleStatusChange(appt.id, "completed")}
                                className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center"
                                title="Mark done"
                              >
                                <CheckCircle2 size={16} className="text-green-600" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(appt.id, "no_show")}
                                className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center"
                                title="No show"
                              >
                                <XCircle size={16} className="text-red-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
