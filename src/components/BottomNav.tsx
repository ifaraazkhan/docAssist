"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Layers, CalendarCheck, Settings } from "lucide-react";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/dashboard", icon: Inbox, label: "Inbox" },
  { href: "/protocols", icon: Layers, label: "Protocols" },
  { href: "/appointments", icon: CalendarCheck, label: "Tokens" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on patient detail page — it has its own chat input bar
  if (pathname?.startsWith("/patients/")) return null;

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => tap()}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-6 py-2.5 min-h-[48px] min-w-[48px] justify-center transition-colors",
                isActive ? "text-brand-600" : "text-gray-400"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-500 rounded-full" />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={cn(
                  "text-[11px] font-semibold",
                  isActive ? "text-brand-700" : "text-gray-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
