"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { Drawer } from "vaul";
import { toast } from "sonner";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Plus, Search, Layers, BookOpen, Check } from "lucide-react";
import {
  getProtocols,
  getLibraryProtocols,
  addLibraryProtocol,
  updateProtocol,
  type Protocol,
  type LibraryProtocol,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { tap, success as hapticSuccess, toggle as hapticToggle } from "@/lib/haptics";

type Tab = "my" | "library";

const SPECIALTIES = ["All", "GP", "Pediatrics", "Cardiology", "Endocrinology", "Dermatology", "Gynecology", "Surgery"];

export default function ProtocolsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("my");
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [previewProto, setPreviewProto] = useState<LibraryProtocol | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  const { data: myData, isLoading: myLoading, mutate: mutateMyProtocols } = useSWR(
    "my-protocols",
    () => getProtocols()
  );
  const { data: libData, isLoading: libLoading } = useSWR(
    ["library-protocols", specialty],
    () => getLibraryProtocols(specialty === "All" ? undefined : specialty)
  );

  const myProtocols = myData?.protocols ?? [];
  const libraryProtocols = libData?.protocols ?? [];

  const addedLibIds = new Set(myProtocols.map((p) => p.librarySourceId).filter(Boolean));

  const filteredMy = search
    ? myProtocols.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase()))
      )
    : myProtocols;

  const filteredLib = search
    ? libraryProtocols.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase()))
      )
    : libraryProtocols;

  const handleAddLibrary = async (proto: LibraryProtocol) => {
    setAdding(proto.id);
    try {
      await addLibraryProtocol(proto.id);
      hapticSuccess();
      toast("Protocol added to My Protocols");
      mutateMyProtocols();
      setPreviewProto(null);
    } catch {
      // Error handled by API layer
    } finally {
      setAdding(null);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    hapticToggle();
    mutateMyProtocols(
      (data) => {
        if (!data) return data;
        return {
          ...data,
          protocols: data.protocols.map((p) =>
            p.id === id ? { ...p, isActive: !isActive } : p
          ),
        };
      },
      false
    );
    try {
      await updateProtocol(id, { isActive: !isActive });
    } catch {
      mutateMyProtocols();
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-text-primary">Protocols</h1>
        <button
          onClick={() => { tap(); router.push("/protocols/new"); }}
          className="w-10 h-10 bg-brand-500 text-white rounded-xl flex items-center justify-center"
          aria-label="Create protocol"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="stat-tabs mb-4">
        <button
          onClick={() => { tap(); setTab("my"); }}
          className={cn("stat-tab", tab === "my" && "active")}
        >
          <Layers size={14} />
          My Protocols
          {myProtocols.length > 0 && (
            <span className="ml-1 text-[11px] opacity-60">({myProtocols.length})</span>
          )}
        </button>
        <button
          onClick={() => { tap(); setTab("library"); }}
          className={cn("stat-tab", tab === "library" && "active")}
        >
          <BookOpen size={14} />
          Library
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "my" ? "Search my protocols..." : "Search library..."}
          className="input-field pl-10"
          aria-label="Search protocols"
        />
      </div>

      <AnimatePresence mode="wait">
        {/* ── MY PROTOCOLS TAB ── */}
        {tab === "my" && (
          <motion.div
            key="my"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {myLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height={72} borderRadius={12} />
                ))}
              </div>
            ) : filteredMy.length > 0 ? (
              <div className="space-y-2">
                {filteredMy.map((proto, i) => (
                  <motion.div
                    key={proto.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-soft"
                  >
                    <button
                      onClick={() => { tap(); router.push(`/protocols/${proto.id}/edit`); }}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-text-primary">{proto.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-text-secondary">
                            {proto.usageCount} uses
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(proto.id, proto.isActive);
                            }}
                            role="switch"
                            aria-checked={proto.isActive}
                            className={cn(
                              "w-10 h-6 rounded-full transition-colors relative flex-shrink-0",
                              proto.isActive ? "bg-brand-500" : "bg-gray-200"
                            )}
                            aria-label={proto.isActive ? "Deactivate" : "Activate"}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform",
                                proto.isActive ? "translate-x-[18px]" : "translate-x-0.5"
                              )}
                            />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        {proto.librarySourceId ? (
                          <span className="badge badge-brand text-[11px]">Library</span>
                        ) : (
                          <span className="badge badge-slate text-[11px]">Custom</span>
                        )}
                        <span className="text-xs text-text-secondary truncate">
                          {proto.keywords.slice(0, 3).join(", ")}
                        </span>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Layers size={28} className="text-gray-300" />
                </div>
                {search ? (
                  <p className="text-sm text-text-secondary">No matching protocols</p>
                ) : (
                  <>
                    <p className="text-base font-semibold text-text-primary mb-1">No protocols yet</p>
                    <p className="text-sm text-text-secondary mb-5">
                      Create your own or browse the library to get started
                    </p>
                    <div className="flex flex-col gap-3 max-w-[240px] mx-auto">
                      <button
                        onClick={() => { tap(); router.push("/protocols/new"); }}
                        className="flex items-center justify-center gap-2 py-3 bg-brand-500 text-white font-semibold rounded-xl text-sm min-h-[48px]"
                      >
                        <Plus size={16} />
                        Create Protocol
                      </button>
                      <button
                        onClick={() => { tap(); setTab("library"); }}
                        className="flex items-center justify-center gap-2 py-3 bg-white text-brand-600 font-semibold rounded-xl text-sm min-h-[48px] border border-brand-200"
                      >
                        <BookOpen size={16} />
                        Browse Library
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── LIBRARY TAB ── */}
        {tab === "library" && (
          <motion.div
            key="library"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Specialty chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 -mx-1 px-1">
              {SPECIALTIES.map((s) => (
                <button
                  key={s}
                  onClick={() => { tap(); setSpecialty(s); }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap min-h-[32px] border transition-colors",
                    specialty === s
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-white text-text-secondary border-gray-200"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {libLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} height={72} borderRadius={12} />
                ))}
              </div>
            ) : filteredLib.length > 0 ? (
              <div className="space-y-2">
                {filteredLib.map((proto, i) => {
                  const isAdded = addedLibIds.has(proto.id);
                  return (
                    <motion.div
                      key={proto.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-white rounded-xl p-4 border border-gray-100 shadow-soft flex items-center gap-3"
                    >
                      <button
                        onClick={() => setPreviewProto(proto)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className="font-semibold text-sm text-text-primary">{proto.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5 truncate">
                          {proto.keywords.slice(0, 3).join(", ")}
                        </p>
                      </button>
                      <button
                        onClick={() => !isAdded && handleAddLibrary(proto)}
                        disabled={isAdded || adding === proto.id}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[36px] flex items-center gap-1 flex-shrink-0",
                          isAdded
                            ? "bg-green-50 text-green-600"
                            : "bg-brand-500 text-white disabled:opacity-50"
                        )}
                      >
                        {isAdded ? (
                          <><Check size={12} /> Added</>
                        ) : adding === proto.id ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><Plus size={12} /> Add</>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen size={28} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-text-secondary">
                  No library protocols for this specialty
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview bottom sheet */}
      <Drawer.Root open={!!previewProto} onOpenChange={(open) => !open && setPreviewProto(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[80dvh] overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-3" />
            {previewProto && (
              <div className="p-6">
                <h3 className="font-bold text-lg text-text-primary mb-1">{previewProto.title}</h3>
                <p className="text-xs text-text-secondary mb-4">
                  {previewProto.keywords.join(", ")}
                </p>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-text-primary whitespace-pre-line leading-relaxed">
                    {previewProto.replyText}
                  </p>
                </div>
                {previewProto.disclaimer && (
                  <p className="text-xs text-amber-600 mb-4">⚠️ {previewProto.disclaimer}</p>
                )}
                <button
                  onClick={() => handleAddLibrary(previewProto)}
                  disabled={addedLibIds.has(previewProto.id) || adding === previewProto.id}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-500 text-white font-semibold rounded-xl text-sm min-h-[48px] disabled:opacity-50"
                >
                  {addedLibIds.has(previewProto.id) ? (
                    <><Check size={16} /> Already Added</>
                  ) : adding === previewProto.id ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Plus size={16} /> Add to My Protocols</>
                  )}
                </button>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
