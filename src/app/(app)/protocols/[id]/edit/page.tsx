"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, Menu, ShieldCheck, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import { getProtocols, updateProtocol, deleteProtocol, type Protocol } from "@/lib/api";
import { getDoctor } from "@/lib/auth";

export default function EditProtocolPage() {
  const router = useRouter();
  const params = useParams();
  const protocolId = params.id as string;
  const doctor = getDoctor();

  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [replyText, setReplyText] = useState("");
  const [addToMenu, setAddToMenu] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!doctor) return;
    getProtocols(doctor.id).then((protocols) => {
      const found = protocols.find((p) => p.id === protocolId);
      if (found) {
        setProtocol(found);
        setTitle(found.title);
        setKeywords(found.keywords.join(", "));
        setReplyText(found.replyText);
        setAddToMenu(found.addToMenu);
      }
    });
  }, [protocolId, doctor?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await updateProtocol(protocolId, {
        title,
        keywords: keywords.split(",").map((k) => k.trim().toLowerCase()),
        replyText,
        addToMenu,
      });
      router.push("/protocols");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteProtocol(protocolId);
      router.push("/protocols");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  };

  if (!protocol) {
    return (
      <div className="page-container pt-20 text-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  const disclaimer =
    "⚠️ This is general guidance only. If symptoms persist or worsen, please visit the clinic or call for an emergency appointment.";

  return (
    <>
      <Header title="Edit Protocol" showBack />

      <div className="page-container">
        <form onSubmit={handleSave} className="space-y-5 animate-fade-in">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Protocol Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Trigger Keywords
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="fever, bukhar, temperature"
              className="input-field"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Comma-separated. Include Hindi/regional terms for better matching.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Auto-Reply Message
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={8}
              className="input-field resize-none leading-relaxed"
              required
            />
          </div>

          {/* Disclaimer */}
          <div className="card p-3.5 bg-amber-50/50 border-amber-200/50">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider mb-1">
                  Auto-appended Disclaimer
                </p>
                <p className="text-[11px] text-amber-700 leading-relaxed">{disclaimer}</p>
              </div>
            </div>
          </div>

          {/* Add to menu toggle */}
          <div className="card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
                <Menu size={16} className="text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Add to WhatsApp Menu</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Patients see this as a button option
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAddToMenu(!addToMenu)}
              className={`w-12 h-7 rounded-full transition-all duration-300 relative ${
                addToMenu ? "bg-brand-500 shadow-soft" : "bg-slate-200"
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-card transition-all duration-300 ${
                  addToMenu ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={15} />
            {deleting ? "Deleting..." : "Delete Protocol"}
          </button>
        </form>
      </div>
    </>
  );
}
