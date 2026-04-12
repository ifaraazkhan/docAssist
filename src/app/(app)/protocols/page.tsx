"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Layers } from "lucide-react";
import Header from "@/components/Header";
import ProtocolCard from "@/components/ProtocolCard";
import { getProtocols, updateProtocol, type Protocol } from "@/lib/api";
import { getDoctor } from "@/lib/auth";

export default function ProtocolsPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const doctor = getDoctor();

  useEffect(() => {
    if (!doctor) return;
    getProtocols(doctor.id)
      .then(setProtocols)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [doctor?.id]);

  const filtered = protocols.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase()))
  );

  const handleToggle = async (id: string) => {
    const protocol = protocols.find((p) => p.id === id);
    if (!protocol) return;

    // Optimistic update
    setProtocols((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );

    try {
      await updateProtocol(id, { isActive: !protocol.isActive });
    } catch (err) {
      // Revert on error
      setProtocols((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: protocol.isActive } : p))
      );
      console.error(err);
    }
  };

  const activeCount = protocols.filter((p) => p.isActive).length;
  const menuCount = protocols.filter((p) => p.addToMenu && p.isActive).length;

  return (
    <>
      <Header
        title="Protocols"
        subtitle={`${activeCount} active · ${menuCount} on WhatsApp menu`}
        rightAction={
          <Link
            href="/protocols/new"
            className="w-9 h-9 bg-brand-500 text-white rounded-xl flex items-center justify-center shadow-soft hover:bg-brand-600 active:scale-95 transition-all"
            aria-label="Add protocol"
          >
            <Plus size={18} strokeWidth={2.5} />
          </Link>
        }
      />

      <div className="page-container">
        {/* Search */}
        <div className="relative mb-5 animate-fade-in">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search protocols or keywords..."
            className="input-field pl-10"
          />
        </div>

        {/* Info banner */}
        <div className="card p-3.5 mb-5 bg-gradient-to-r from-brand-50 to-transparent border-brand-100/50 animate-fade-in stagger-2">
          <div className="flex items-start gap-2.5">
            <Layers size={16} className="text-brand-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Protocols become <span className="font-semibold">WhatsApp menu buttons</span>.
                When a patient messages your clinic, they see these as options to get instant advice.
              </p>
            </div>
          </div>
        </div>

        {/* Protocol list */}
        <div className="space-y-3">
          {loading ? (
            <div className="card p-8 text-center animate-fade-in">
              <p className="text-sm text-slate-400">Loading protocols...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((protocol, i) => (
              <div key={protocol.id} className={`stagger-${Math.min(i + 1, 6)}`}>
                <ProtocolCard protocol={protocol} onToggle={handleToggle} />
              </div>
            ))
          ) : (
            <div className="card p-8 text-center animate-fade-in">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Layers size={20} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                {search ? "No matching protocols" : "No protocols yet"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {search
                  ? "Try a different search term"
                  : "Create your first protocol to start automating"}
              </p>
              {!search && (
                <Link href="/protocols/new" className="btn-primary mt-4 text-sm">
                  <Plus size={16} />
                  Create Protocol
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
