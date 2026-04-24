"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import useSWR from "swr";
import { Drawer } from "vaul";
import { toast } from "sonner";
import { ArrowLeft, X, Trash2 } from "lucide-react";
import { getProtocols, updateProtocol, deleteProtocol } from "@/lib/api";
import { tap, success as hapticSuccess, error as hapticError } from "@/lib/haptics";
import { cn } from "@/lib/cn";

const MAX_REPLY_LENGTH = 4096;

export default function EditProtocolPage() {
  const router = useRouter();
  const params = useParams();
  const protocolId = params.id as string;

  const { data } = useSWR("my-protocols", () => getProtocols());
  const protocol = data?.protocols.find((p) => p.id === protocolId);

  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [replyText, setReplyText] = useState("");
  const [disclaimer, setDisclaimer] = useState("");
  const [addToMenu, setAddToMenu] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Initialize form from fetched protocol
  useEffect(() => {
    if (protocol) {
      setTitle(protocol.title);
      setKeywords(protocol.keywords);
      setReplyText(protocol.replyText);
      setDisclaimer(protocol.disclaimer ?? "");
      setAddToMenu(protocol.addToMenu);
      setIsActive(protocol.isActive);
    }
  }, [protocol]);

  const isSystem = protocol?.protocolType === "system";
  const isLibrary = protocol?.protocolType === "library";
  const titleLocked = isSystem || isLibrary; // title locked for system & library
  const keywordsLocked = isSystem; // keywords editable for library & custom

  const handleAddKeyword = () => {
    const word = keywordInput.trim().toLowerCase();
    if (word && !keywords.includes(word)) {
      setKeywords([...keywords, word]);
      tap();
    }
    setKeywordInput("");
  };

  const handleRemoveKeyword = (kw: string) => {
    tap();
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await updateProtocol(protocolId, {
        ...(titleLocked ? {} : { title: title.trim() }),
        ...(keywordsLocked ? {} : { keywords }),
        replyText: replyText.trim(),
        disclaimer: disclaimer.trim() || undefined,
        addToMenu,
        isActive,
      });
      hapticSuccess();
      toast("Protocol updated");
      router.push("/protocols");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProtocol(protocolId);
      hapticError();
      toast("Protocol deleted");
      router.push("/protocols");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
    setShowDelete(false);
  };

  if (!protocol) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      {/* Header */}
      <div className="bg-white border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1 -ml-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft size={20} className="text-text-primary" />
        </button>
        <h1 className="font-semibold text-text-primary">Edit Protocol</h1>
      </div>

      <div className="page-container max-w-sm mx-auto">
        <form onSubmit={handleSave} className="space-y-5">
          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">
              Protocol Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              disabled={titleLocked}
            />
            {titleLocked && (
              <p className="text-[11px] text-amber-600 mt-1">{isSystem ? 'System' : 'Library'} protocol — title cannot be changed</p>
            )}
          </motion.div>

          {/* Keywords */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">
              Trigger Keywords
            </label>
            {!keywordsLocked && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="Type keyword + Enter"
                  className="input-field flex-1"
                />
              </div>
            )}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-xs font-medium"
                  >
                    {kw}
                    {!keywordsLocked && (
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="p-0.5 min-w-[24px] min-h-[24px] flex items-center justify-center"
                        aria-label={`Remove ${kw}`}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
            {keywordsLocked && (
              <p className="text-[11px] text-amber-600 mt-1">System protocol — keywords cannot be changed</p>
            )}
          </motion.div>

          {/* Reply Text */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-text-primary">Reply Message</label>
              <span className={cn(
                "text-xs",
                replyText.length > MAX_REPLY_LENGTH ? "text-urgent" : "text-text-secondary"
              )}>
                {replyText.length} / {MAX_REPLY_LENGTH}
              </span>
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={6}
              className="input-field resize-none leading-relaxed"
              maxLength={MAX_REPLY_LENGTH}
            />
          </motion.div>

          {/* Disclaimer */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <label className="text-sm font-medium text-text-primary mb-1.5 block">Disclaimer</label>
            <input
              type="text"
              value={disclaimer}
              onChange={(e) => setDisclaimer(e.target.value)}
              placeholder="Auto-appended to the reply"
              className="input-field"
            />
          </motion.div>

          {/* Toggles */}
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 flex items-center justify-between border border-gray-100">
              <div>
                <p className="text-sm font-medium text-text-primary">Add to WhatsApp Menu</p>
                <p className="text-[11px] text-text-secondary mt-0.5">Patients see this as a button</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={addToMenu}
                aria-label="Add to WhatsApp Menu"
                onClick={() => { setAddToMenu(!addToMenu); tap(); }}
                className={cn(
                  "w-11 h-[26px] rounded-full transition-colors relative flex-shrink-0",
                  addToMenu ? "bg-brand-500" : "bg-gray-300"
                )}
              >
                <span className={cn(
                  "absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow transition-transform",
                  addToMenu ? "translate-x-[18px]" : "translate-x-0"
                )} />
              </button>
            </div>

            <div className="bg-white rounded-xl p-4 flex items-center justify-between border border-gray-100">
              <div>
                <p className="text-sm font-medium text-text-primary">Active</p>
                <p className="text-[11px] text-text-secondary mt-0.5">Auto-replies when matched</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                aria-label="Protocol active"
                onClick={() => { setIsActive(!isActive); tap(); }}
                className={cn(
                  "w-11 h-[26px] rounded-full transition-colors relative flex-shrink-0",
                  isActive ? "bg-brand-500" : "bg-gray-300"
                )}
              >
                <span className={cn(
                  "absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow transition-transform",
                  isActive ? "translate-x-[18px]" : "translate-x-0"
                )} />
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-urgent font-medium">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-brand-500 text-white font-semibold rounded-xl text-sm min-h-[48px] disabled:opacity-50"
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Save Changes"
            )}
          </button>

          {/* Delete */}
          {!isSystem && (
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="w-full flex items-center justify-center gap-2 py-3 text-urgent font-medium text-sm min-h-[44px]"
            >
              <Trash2 size={15} />
              Delete Protocol
            </button>
          )}
        </form>
      </div>

      {/* Delete confirmation drawer */}
      <Drawer.Root open={showDelete} onOpenChange={setShowDelete}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-3" />
            <div className="p-6 text-center">
              <Trash2 size={24} className="text-urgent mx-auto mb-3" />
              <h3 className="font-semibold text-text-primary mb-1">Delete this protocol?</h3>
              <p className="text-sm text-text-secondary mb-6">This can&apos;t be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDelete(false)}
                  className="flex-1 py-3 bg-gray-100 rounded-xl font-medium text-sm min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-3 bg-urgent text-white rounded-xl font-semibold text-sm min-h-[48px] disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
