"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function Header({
  title,
  subtitle,
  showBack = false,
  rightAction,
}: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-[#f7f6f3]/85 backdrop-blur-xl border-b border-slate-200/60">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200"
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl text-slate-950 truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 tracking-wide uppercase">{subtitle}</p>
          )}
        </div>

        {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
      </div>
    </header>
  );
}
