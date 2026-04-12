"use client";

import { useState } from "react";
import {
  User,
  Building2,
  Phone,
  Mail,
  MessageCircle,
  Shield,
  LogOut,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  Crown,
} from "lucide-react";
import Header from "@/components/Header";
import { mockDoctor } from "@/lib/mockData";

export default function SettingsPage() {
  const [doctor] = useState(mockDoctor);

  return (
    <>
      <Header title="Settings" />

      <div className="page-container">
        {/* Profile card */}
        <div className="card p-5 mb-5 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center flex-shrink-0">
              <User size={28} className="text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-lg text-slate-900">
                {doctor.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {doctor.specialty}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Crown size={12} className="text-amber-500" />
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  {doctor.plan} Plan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Clinic details */}
        <div className="mb-5 animate-fade-in stagger-2">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">
            Clinic Details
          </h3>
          <div className="card divide-y divide-slate-50">
            <SettingsRow
              icon={<Building2 size={16} />}
              label="Clinic Name"
              value={doctor.clinicName}
            />
            <SettingsRow
              icon={<Phone size={16} />}
              label="Phone"
              value={doctor.phone}
            />
            <SettingsRow
              icon={<Mail size={16} />}
              label="Email"
              value={doctor.email}
            />
          </div>
        </div>

        {/* WhatsApp connection */}
        <div className="mb-5 animate-fade-in stagger-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">
            WhatsApp Integration
          </h3>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <MessageCircle size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    WhatsApp Business
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {doctor.whatsappConnected ? (
                      <>
                        <CheckCircle2 size={10} className="text-green-500" />
                        <span className="text-[10px] text-green-600 font-medium">
                          Connected
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Not connected
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button className="text-xs text-brand-600 font-medium hover:text-brand-700 transition-colors flex items-center gap-1">
                {doctor.whatsappConnected ? "Manage" : "Connect"}
                <ExternalLink size={12} />
              </button>
            </div>

            {doctor.whatsappConnected && (
              <div className="mt-3 p-3 bg-green-50/50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={12} className="text-green-600" />
                  <span className="text-[10px] font-semibold text-green-700 uppercase tracking-wider">
                    Account Health
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-green-100 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full w-[90%]" />
                  </div>
                  <span className="text-[10px] font-bold text-green-700">
                    Good
                  </span>
                </div>
                <p className="text-[10px] text-green-600 mt-1">
                  Quality rating: Green · No flags or restrictions
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subscription */}
        <div className="mb-5 animate-fade-in stagger-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">
            Subscription
          </h3>
          <div className="card p-4 bg-gradient-to-br from-brand-50 to-transparent border-brand-100/40">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-brand-800">
                  Pro Plan — ₹499/month
                </p>
                <p className="text-[10px] text-brand-600 mt-0.5">
                  Renews on May 9, 2026
                </p>
              </div>
              <Crown size={20} className="text-amber-500" />
            </div>
            <div className="space-y-1.5">
              {[
                "Unlimited protocols",
                "Unlimited patient conversations",
                "Urgent message flagging",
                "Priority support",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-brand-500" />
                  <span className="text-[11px] text-slate-600">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="animate-fade-in stagger-5">
          <button className="w-full card p-4 flex items-center justify-between text-slate-500 hover:text-red-500 hover:border-red-100 transition-all group">
            <div className="flex items-center gap-3">
              <LogOut size={16} className="group-hover:text-red-500" />
              <span className="text-sm font-medium">Sign Out</span>
            </div>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

function SettingsRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm text-slate-700 truncate">{value}</p>
      </div>
      <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
    </div>
  );
}
