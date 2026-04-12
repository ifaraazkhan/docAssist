"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "brand" | "urgent" | "slate";
}

export default function StatCard({
  label,
  value,
  icon,
  accent = "brand",
}: StatCardProps) {
  const accentColors = {
    brand: "from-brand-50 to-brand-100/50 text-brand-700",
    urgent: "from-urgent-bg to-red-100/50 text-urgent-text",
    slate: "from-slate-50 to-slate-100/50 text-slate-600",
  };

  const iconColors = {
    brand: "bg-brand-100 text-brand-600",
    urgent: "bg-urgent-bg text-urgent",
    slate: "bg-slate-100 text-slate-500",
  };

  return (
    <div
      className={`card p-4 bg-gradient-to-br ${accentColors[accent]} border-0`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-display">{value}</p>
          <p className="text-[11px] mt-0.5 opacity-70">{label}</p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl ${iconColors[accent]} flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
