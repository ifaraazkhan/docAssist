"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { Inbox, Layers, CalendarCheck, Settings } from "lucide-react";
import { getAppointments } from "@/lib/api";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/dashboard", icon: Inbox, label: "Inbox" },
  { href: "/protocols", icon: Layers, label: "Protocols" },
  { href: "/appointments", icon: CalendarCheck, label: "Appts" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const seenRef = useRef(false);

  // Fetch today's booked count for badge
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: apptData } = useSWR(
    ["nav-appointments", todayStr],
    () => getAppointments(todayStr),
    { refreshInterval: 30000, revalidateOnFocus: true }
  );
  const bookedToday = apptData?.appointments?.filter((a) => a.status === "booked").length ?? 0;

  // Clear badge when user visits appointments page
  const isOnAppts = pathname === "/appointments" || pathname?.startsWith("/appointments/");
  useEffect(() => {
    if (isOnAppts) seenRef.current = true;
  }, [isOnAppts]);

  // Reset "seen" when count changes (new bookings came in)
  const prevCount = useRef(bookedToday);
  useEffect(() => {
    if (bookedToday > prevCount.current) seenRef.current = false;
    prevCount.current = bookedToday;
  }, [bookedToday]);

  // Hide on patient detail page — it has its own chat input bar
  if (pathname?.startsWith("/patients/")) return null;

  const showBadge = bookedToday > 0 && !isOnAppts && !seenRef.current;

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
              <span className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {item.href === "/appointments" && showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-sm">
                    {bookedToday}
                  </span>
                )}
              </span>
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
