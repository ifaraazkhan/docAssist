"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Layers, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Inbox, label: "Inbox" },
  { href: "/protocols", icon: Layers, label: "Protocols" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 safe-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around py-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl transition-all duration-200 min-h-[44px] justify-center ${
                isActive
                  ? "text-brand-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className="transition-all duration-200"
                />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-500 rounded-full" />
                )}
              </div>
              <span
                className={`text-[10px] tracking-wide font-semibold ${
                  isActive ? "text-brand-700" : "text-slate-500"
                }`}
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
