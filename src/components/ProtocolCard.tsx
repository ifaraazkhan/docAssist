"use client";

import Link from "next/link";
import { Zap, ZapOff, Menu, BarChart3, Pencil } from "lucide-react";
import type { Protocol } from "@/lib/api";

interface ProtocolCardProps {
  protocol: Protocol;
  onToggle?: (id: string) => void;
}

export default function ProtocolCard({ protocol, onToggle }: ProtocolCardProps) {
  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        {/* Left side */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 text-sm truncate">
              {protocol.title}
            </h3>
            {protocol.addToMenu && (
              <span className="badge-brand text-[10px] flex-shrink-0">
                <Menu size={10} />
                Menu
              </span>
            )}
          </div>

          {/* Keywords */}
          <div className="flex flex-wrap gap-1 mt-2">
            {protocol.keywords.slice(0, 4).map((kw) => (
              <span
                key={kw}
                className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full"
              >
                {kw}
              </span>
            ))}
            {protocol.keywords.length > 4 && (
              <span className="text-[10px] px-2 py-0.5 text-slate-400">
                +{protocol.keywords.length - 4}
              </span>
            )}
          </div>

          {/* Usage stat */}
          <div className="flex items-center gap-1 mt-2.5 text-slate-400">
            <BarChart3 size={12} />
            <span className="text-[11px]">
              Used {protocol.usageCount} times
            </span>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => onToggle?.(protocol.id)}
          className={`flex-shrink-0 w-12 h-7 rounded-full transition-all duration-300 relative ${
            protocol.isActive
              ? "bg-brand-500 shadow-soft"
              : "bg-slate-200"
          }`}
          aria-label={`Toggle ${protocol.title}`}
        >
          <div
            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-card flex items-center justify-center transition-all duration-300 ${
              protocol.isActive ? "left-[22px]" : "left-0.5"
            }`}
          >
            {protocol.isActive ? (
              <Zap size={12} className="text-brand-500" />
            ) : (
              <ZapOff size={12} className="text-slate-400" />
            )}
          </div>
        </button>
      </div>

      {/* Preview */}
      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-[11px] text-slate-500 whitespace-pre-line line-clamp-3 leading-relaxed">
          {protocol.replyText}
        </p>
      </div>

      {/* Edit link */}
      <Link
        href={`/protocols/${protocol.id}/edit`}
        className="mt-3 flex items-center gap-1.5 text-[11px] text-brand-600 font-medium hover:text-brand-700 transition-colors"
      >
        <Pencil size={11} />
        Edit protocol
      </Link>
    </div>
  );
}
