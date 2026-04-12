"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Menu, Lightbulb, ShieldCheck, X } from "lucide-react";
import Header from "@/components/Header";
import { createProtocol } from "@/lib/api";
import { getDoctor } from "@/lib/auth";

const suggestedProtocols = [
  { title: "Fever Management", keywords: "fever, bukhar, temperature, hot" },
  { title: "Diarrhea & Vomiting", keywords: "diarrhea, vomiting, loose motion, ulti" },
  { title: "Cold & Cough", keywords: "cold, cough, sardi, khansi" },
  { title: "Headache", keywords: "headache, sir dard, migraine" },
  { title: "Skin Rash", keywords: "rash, khujli, itching, allergy" },
  { title: "Clinic Timings", keywords: "time, timing, open, close, hours" },
];

export default function NewProtocolPage() {
  const router = useRouter();
  const doctor = getDoctor();

  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [replyText, setReplyText] = useState("");
  const [addToMenu, setAddToMenu] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSuggestion = (suggestion: (typeof suggestedProtocols)[0]) => {
    setTitle(suggestion.title);
    setKeywords(suggestion.keywords);
    setShowSuggestions(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return;
    setError("");
    setSaving(true);
    try {
      await createProtocol({ doctorId: doctor.id, title, keywords, replyText, addToMenu });
      router.push("/protocols");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save protocol");
    } finally {
      setSaving(false);
    }
  };

  const disclaimer =
    "⚠️ This is general guidance only. If symptoms persist or worsen, please visit the clinic or call for an emergency appointment.";

  return (
    <>
      <Header title="New Protocol" showBack />

      <div className="page-container">
        {/* Suggestion chips */}
        {showSuggestions && (
          <div className="card p-4 mb-5 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb size={14} className="text-amber-500" />
                <span className="text-xs font-semibold text-slate-700">
                  Quick Start — Common Protocols
                </span>
              </div>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close suggestions"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedProtocols.map((s) => (
                <button
                  key={s.title}
                  onClick={() => handleSuggestion(s)}
                  className="text-xs px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg border border-brand-100 hover:bg-brand-100 transition-colors"
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-5 animate-fade-in stagger-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Protocol Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fever Management"
              className="input-field"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">
              This becomes the button label in the WhatsApp menu
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Trigger Keywords
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="fever, bukhar, temperature, hot"
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
              placeholder="Enter the medical advice that will be sent to the patient..."
              rows={8}
              className="input-field resize-none leading-relaxed"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Use numbered lists and emojis for readability. Supports WhatsApp formatting (*bold*, _italic_).
            </p>
          </div>

          {/* Disclaimer preview */}
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
            {saving ? "Saving..." : "Save Protocol"}
          </button>
        </form>
      </div>
    </>
  );
}
