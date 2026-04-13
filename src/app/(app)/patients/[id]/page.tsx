"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  MessageSquare,
  StickyNote,
  Bot,
  Send,
  Mic,
  CheckCircle2,
} from "lucide-react";
import Header from "@/components/Header";
import { getPatient, getMessages, sendMessage, getNotes, createNote, updatePatient, type Patient, type Message, type PrivateNote } from "@/lib/api";

type ChatMode = "chat" | "notes";

export default function PatientChatPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [mode, setMode] = useState<ChatMode>("chat");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<PrivateNote[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newNote, setNewNote] = useState("");
  const [sending, setSending] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [resolving, setResolving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPatient(patientId).then(setPatient).catch(console.error);
    getMessages(patientId).then(setMessages).catch(console.error);
    getNotes(patientId).then(setNotes).catch(console.error);
  }, [patientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(patientId, newMessage.trim());
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim() || savingNote) return;
    setSavingNote(true);
    try {
      const note = await createNote(patientId, newNote.trim());
      setNotes((prev) => [...prev, note]);
      setNewNote("");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleResolve = async () => {
    if (!patient || resolving) return;
    setResolving(true);
    try {
      await updatePatient(patientId, { isUrgent: false });
      setPatient((prev) => prev ? { ...prev, isUrgent: false } : prev);
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  if (!patient) {
    return (
      <div className="page-container pt-20 text-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-surface-warm">
      {/* Header */}
      <Header
        title={patient.name ?? patient.phone}
        subtitle={patient.phone}
        showBack
        rightAction={
          patient.isUrgent ? (
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-urgent-bg border border-red-200 text-urgent-text text-xs font-semibold transition-all duration-200 hover:bg-red-100 active:scale-95 disabled:opacity-60"
            >
              <AlertCircle size={12} />
              {resolving ? "Resolving…" : "Mark Resolved"}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">Resolved</span>
            </div>
          )
        }
      />

      {/* Mode toggle */}
      <div className="px-4 pb-2 max-w-lg mx-auto w-full">
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setMode("chat")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              mode === "chat"
                ? "bg-white text-brand-700 shadow-soft"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <MessageSquare size={14} />
            Chat
          </button>
          <button
            onClick={() => setMode("notes")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              mode === "notes"
                ? "bg-white text-amber-700 shadow-soft"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <StickyNote size={14} />
            Private Notes
          </button>
        </div>
      </div>

      {/* Chat / Notes content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 max-w-lg mx-auto w-full scrollbar-hide">
        {mode === "chat" ? (
          <div className="space-y-3 pt-2">
            {messages.map((msg) => {
              const isPatient = msg.sender === "patient";
              const isBot = msg.sender === "bot";

              return (
                <div
                  key={msg.id}
                  className={`flex ${isPatient ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 animate-fade-in ${
                      isPatient
                        ? "bg-white shadow-soft border border-slate-100 rounded-bl-md"
                        : isBot
                        ? "bg-brand-50 border border-brand-100 rounded-br-md"
                        : "bg-brand-600 text-white rounded-br-md"
                    }`}
                  >
                    {isBot && (
                      <div className="flex items-center gap-1 mb-1">
                        <Bot size={10} className="text-brand-500" />
                        <span className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider">
                          Bot Auto-Reply
                        </span>
                      </div>
                    )}

                    {msg.protocolName && (
                      <div className="badge-brand text-[10px] mb-2">
                        Protocol: {msg.protocolName}
                      </div>
                    )}

                    <p
                      className={`text-[13px] leading-relaxed whitespace-pre-line ${
                        isPatient
                          ? "text-slate-800"
                          : isBot
                          ? "text-slate-700"
                          : "text-white"
                      }`}
                    >
                      {msg.content}
                    </p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isPatient
                          ? "text-slate-400"
                          : isBot
                          ? "text-brand-400"
                          : "text-brand-200"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}

            {messages.length === 0 && (
              <div className="text-center pt-16">
                <MessageSquare size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No messages yet</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="card p-3.5 bg-amber-50/50 border-amber-200/30 animate-fade-in">
              <div className="flex items-start gap-2">
                <StickyNote size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Private notes are only visible to you. They are never sent to the
                  patient or shared with WhatsApp.
                </p>
              </div>
            </div>

            {notes.map((note) => (
              <div
                key={note.id}
                className="card p-4 border-l-4 border-l-amber-400 animate-fade-in"
              >
                <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">
                  {note.content}
                </p>
                <p className="text-[10px] text-slate-400 mt-2">
                  {new Date(note.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}

            {notes.length === 0 && (
              <div className="text-center pt-12">
                <StickyNote size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-1">No notes for this patient</p>
                <p className="text-xs text-slate-300">
                  Add clinical notes, history, or reminders below
                </p>
              </div>
            )}

            <div className="card p-4 animate-fade-in">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a private note about this patient..."
                rows={3}
                className="input-field resize-none text-sm"
              />
              <button
                type="button"
                className="btn-secondary mt-3 w-full text-sm"
                onClick={handleSaveNote}
                disabled={savingNote}
              >
                <StickyNote size={14} />
                {savingNote ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat input bar */}
      {mode === "chat" && (
        <div className="border-t border-slate-100 bg-white/80 backdrop-blur-xl px-4 py-3 safe-bottom">
          <div className="max-w-lg mx-auto flex items-end gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="input-field pr-10 py-2.5 text-sm"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Voice note"
              >
                <Mic size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="w-10 h-10 bg-brand-500 text-white rounded-xl flex items-center justify-center shadow-soft hover:bg-brand-600 active:scale-95 transition-all flex-shrink-0 disabled:opacity-50"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
