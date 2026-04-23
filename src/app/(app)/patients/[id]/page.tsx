"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useSWR, { mutate as globalMutate } from "swr";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Drawer } from "vaul";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  StickyNote,
  MessageSquare,
  FileText,
  MoreVertical,
  Phone,
  AlertCircle,
  Shield,
  Bot,
  Clock,
  Trash2,
  Upload,
} from "lucide-react";
import {
  getPatient,
  getMessages,
  sendMessage,
  markRead,
  getNotes,
  createNote,
  deleteNote,
  updatePatient,
  type Patient,
  type Message,
  type PrivateNote,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { tap, success as hapticSuccess, error as hapticError } from "@/lib/haptics";
import { format, isToday, isYesterday } from "date-fns";

type Tab = "chat" | "notes" | "docs";

const QUICK_REPLIES = [
  "Please visit clinic",
  "Continue medication",
  "Report looks normal",
  "I'll call you",
];

function escapeHtml(text: string) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatMsgTime(dateStr: string) {
  try {
    return format(new Date(dateStr), "hh:mm a");
  } catch {
    return "";
  }
}

function dateSeparator(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "dd MMM yyyy");
  } catch {
    return "";
  }
}

export default function PatientChatPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [tab, setTab] = useState<Tab>("chat");
  const [newMessage, setNewMessage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [sending, setSending] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<
    { id: string; content: string; status: "sending" | "failed" }[]
  >([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: patientData } = useSWR(`patient-${patientId}`, () => getPatient(patientId));
  const { data: messagesData, isLoading: msgsLoading } = useSWR(
    `messages-${patientId}`,
    () => getMessages(patientId)
  );
  const { data: notesData, isLoading: notesLoading } = useSWR(
    `notes-${patientId}`,
    () => getNotes(patientId)
  );

  const patient = patientData?.patient;
  const messages = messagesData?.messages ?? [];
  const notes = notesData?.notes ?? [];

  // Mark read on mount
  useEffect(() => {
    markRead(patientId).catch(() => {});
  }, [patientId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (tab === "chat") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, pendingMessages, tab]);

  const handleSend = useCallback(async () => {
    const content = newMessage.trim();
    if (!content || sending) return;

    const tempId = `temp-${Date.now()}`;
    setPendingMessages((prev) => [...prev, { id: tempId, content, status: "sending" }]);
    setNewMessage("");
    setSending(true);
    hapticSuccess();

    try {
      const res = await sendMessage(patientId, content);
      setPendingMessages((prev) => prev.filter((m) => m.id !== tempId));
      // Update SWR cache
      globalMutate(`messages-${patientId}`, (data: typeof messagesData) => {
        if (!data) return data;
        return { ...data, messages: [...data.messages, res.message] };
      }, false);
    } catch {
      hapticError();
      setPendingMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
    } finally {
      setSending(false);
    }
  }, [newMessage, sending, patientId, messagesData]);

  const handleRetry = async (tempId: string, content: string) => {
    setPendingMessages((prev) =>
      prev.map((m) => (m.id === tempId ? { ...m, status: "sending" } : m))
    );
    try {
      const res = await sendMessage(patientId, content);
      setPendingMessages((prev) => prev.filter((m) => m.id !== tempId));
      globalMutate(`messages-${patientId}`, (data: typeof messagesData) => {
        if (!data) return data;
        return { ...data, messages: [...data.messages, res.message] };
      }, false);
      hapticSuccess();
    } catch {
      hapticError();
      setPendingMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim() || savingNote) return;
    setSavingNote(true);
    try {
      const res = await createNote(patientId, newNote.trim());
      globalMutate(`notes-${patientId}`, (data: typeof notesData) => {
        if (!data) return data;
        return { ...data, notes: [...data.notes, res.note] };
      }, false);
      setNewNote("");
      hapticSuccess();
      toast("Note saved");
    } catch {
      hapticError();
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteNoteId) return;
    try {
      await deleteNote(deleteNoteId);
      globalMutate(`notes-${patientId}`, (data: typeof notesData) => {
        if (!data) return data;
        return { ...data, notes: data.notes.filter((n) => n.id !== deleteNoteId) };
      }, false);
      hapticSuccess();
      toast("Note deleted");
    } catch {
      hapticError();
    }
    setDeleteNoteId(null);
  };

  const handleToggleUrgent = async () => {
    if (!patient) return;
    setMenuOpen(false);
    try {
      await updatePatient(patientId, { isUrgent: !patient.isUrgent });
      globalMutate(`patient-${patientId}`);
      hapticSuccess();
      toast(patient.isUrgent ? "Removed urgent" : "Marked urgent");
    } catch {
      hapticError();
    }
  };

  const handleQuickReply = (text: string) => {
    tap();
    setNewMessage(text);
    inputRef.current?.focus();
  };

  // Build date-grouped messages
  let lastDate = "";

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-[var(--bg)]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initial = patient.name ? patient.name.charAt(0).toUpperCase() : "?";

  return (
    <div className="flex flex-col h-dvh bg-[var(--bg)]">
      {/* ── Header ── */}
      <div className="bg-white border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-1 -ml-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Back to inbox"
        >
          <ArrowLeft size={20} className="text-text-primary" />
        </button>

        <div className={cn(
          "w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm flex-shrink-0",
          patient.isUrgent ? "from-red-400 to-red-500" : "from-brand-400 to-brand-500"
        )}>
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-text-primary truncate">
            {patient.name || patient.phone}
          </p>
          <p className="text-[11px] text-text-secondary">{patient.phone}</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="More options"
          >
            <MoreVertical size={18} className="text-text-secondary" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-elevated border border-gray-100 z-30 w-48 py-1">
              <button
                onClick={handleToggleUrgent}
                className="w-full text-left px-4 py-3 text-sm flex items-center gap-2 min-h-[44px]"
              >
                <AlertCircle size={16} className={patient.isUrgent ? "text-green-500" : "text-urgent"} />
                {patient.isUrgent ? "Remove Urgent" : "Mark Urgent"}
              </button>
              <a
                href={`tel:${patient.phone}`}
                className="w-full text-left px-4 py-3 text-sm flex items-center gap-2 min-h-[44px]"
                onClick={() => setMenuOpen(false)}
              >
                <Phone size={16} className="text-text-secondary" />
                Call Patient
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white px-4 pb-2">
        <div className="stat-tabs">
          {([
            { key: "chat" as Tab, icon: MessageSquare, label: "Chat" },
            { key: "notes" as Tab, icon: StickyNote, label: "Notes" },
            { key: "docs" as Tab, icon: FileText, label: "Docs" },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => { tap(); setTab(t.key); }}
              className={cn("stat-tab", tab === t.key && "active")}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* CHAT TAB */}
          {tab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col px-4 py-2 max-w-lg mx-auto"
              role="log"
              aria-live="polite"
            >
              {msgsLoading ? (
                <div className="space-y-4 py-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={i % 2 === 0 ? "self-start" : "self-end ml-auto"}>
                      <Skeleton width={200} height={48} borderRadius={16} />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 && pendingMessages.length === 0 ? (
                <div className="text-center pt-20">
                  <MessageSquare size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">No messages yet</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const dateLabel = dateSeparator(msg.createdAt);
                    let showSep = false;
                    if (dateLabel !== lastDate) {
                      lastDate = dateLabel;
                      showSep = true;
                    }

                    return (
                      <div key={msg.id}>
                        {showSep && (
                          <div className="text-center my-4">
                            <span className="text-[11px] text-text-secondary bg-gray-100 px-3 py-1 rounded-full">
                              {dateLabel}
                            </span>
                          </div>
                        )}
                        <div className={cn(
                          "mb-2 flex",
                          msg.sender === "patient" ? "justify-start" : "justify-end"
                        )}>
                          <div className={cn(
                            msg.sender === "patient" && "b-in",
                            msg.sender === "doctor" && "b-out",
                            msg.sender === "bot" && "b-bot"
                          )}>
                            {msg.sender === "bot" && (
                              <div className="flex items-center gap-1 mb-1">
                                <Bot size={10} className="text-brand-500" />
                                <span className="text-[11px] font-semibold text-brand-600">
                                  Bot Auto-Reply
                                </span>
                              </div>
                            )}
                            <p className="whitespace-pre-line"
                               dangerouslySetInnerHTML={{ __html: escapeHtml(msg.content) }}
                            />
                            <p className={cn(
                              "text-[11px] mt-1",
                              msg.sender === "doctor" ? "text-white/70" : "text-text-secondary"
                            )}>
                              {formatMsgTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pending (optimistic) messages */}
                  {pendingMessages.map((pm) => (
                    <div key={pm.id} className="mb-2 flex justify-end">
                      <div className={cn("b-out", pm.status === "failed" && "opacity-70")}>
                        <p className="whitespace-pre-line">{pm.content}</p>
                        <p className="text-[11px] mt-1 text-white/70 flex items-center gap-1">
                          {pm.status === "sending" && (
                            <><Clock size={8} /> Sending...</>
                          )}
                          {pm.status === "failed" && (
                            <button
                              onClick={() => handleRetry(pm.id, pm.content)}
                              className="underline"
                            >
                              Tap to retry
                            </button>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
              <div ref={bottomRef} />
            </motion.div>
          )}

          {/* NOTES TAB */}
          {tab === "notes" && (
            <motion.div
              key="notes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 py-4 max-w-lg mx-auto"
            >
              {notesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} height={72} borderRadius={12} />
                  ))}
                </div>
              ) : (
                <>
                  {notes.length === 0 && (
                    <div className="text-center pt-12 mb-6">
                      <StickyNote size={32} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-text-secondary">No notes yet</p>
                      <p className="text-xs text-text-secondary mt-1">
                        Add a private note about this patient
                      </p>
                    </div>
                  )}
                  <div className="space-y-3 mb-4">
                    {notes.map((note, i) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-xl p-4 border-l-4 border-l-amber-400 shadow-soft"
                      >
                        <p className="text-sm text-text-primary whitespace-pre-line">
                          {note.content}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[11px] text-text-secondary">
                            {format(new Date(note.createdAt), "dd MMM, hh:mm a")}
                          </p>
                          <button
                            onClick={() => setDeleteNoteId(note.id)}
                            className="p-1 text-gray-400 min-h-[32px] min-w-[32px] flex items-center justify-center"
                            aria-label="Delete note"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Add note */}
                  <div className="bg-white rounded-xl p-4 shadow-soft">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a private note..."
                      rows={3}
                      className="input-field resize-none text-sm"
                    />
                    <button
                      onClick={handleSaveNote}
                      disabled={savingNote || !newNote.trim()}
                      className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white font-semibold rounded-xl text-sm min-h-[44px] disabled:opacity-50"
                    >
                      {savingNote ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <StickyNote size={14} />
                          Add Note
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* DOCS TAB */}
          {tab === "docs" && (
            <motion.div
              key="docs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 py-4 max-w-lg mx-auto"
            >
              <div className="text-center pt-12">
                <FileText size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-text-secondary mb-1">No documents yet</p>
                <p className="text-xs text-text-secondary mb-4">
                  Lab reports, prescriptions, and images will appear here
                </p>
                <button
                  onClick={() => toast("Coming soon")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-text-secondary font-medium rounded-xl text-sm min-h-[44px]"
                >
                  <Upload size={16} />
                  Upload Document
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Chat input bar ── */}
      {tab === "chat" && (
        <div className="border-t border-[var(--border)] bg-white px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {/* Quick replies */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2 -mx-1 px-1">
            {QUICK_REPLIES.map((text) => (
              <button
                key={text}
                onClick={() => handleQuickReply(text)}
                className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-text-secondary whitespace-nowrap min-h-[32px]"
              >
                {text}
              </button>
            ))}
          </div>

          <div className="max-w-lg mx-auto flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="input-field flex-1 resize-none text-sm max-h-24 py-3"
              style={{ minHeight: "44px" }}
            />
            <button
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="w-10 h-10 bg-brand-500 text-white rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-opacity"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete note confirmation drawer */}
      <Drawer.Root open={!!deleteNoteId} onOpenChange={(open) => !open && setDeleteNoteId(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-3" />
            <div className="p-6 text-center">
              <Trash2 size={24} className="text-urgent mx-auto mb-3" />
              <h3 className="font-semibold text-text-primary mb-1">Delete this note?</h3>
              <p className="text-sm text-text-secondary mb-6">This can&apos;t be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteNoteId(null)}
                  className="flex-1 py-3 bg-gray-100 rounded-xl font-medium text-sm min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteNote}
                  className="flex-1 py-3 bg-urgent text-white rounded-xl font-semibold text-sm min-h-[48px]"
                >
                  Delete
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
