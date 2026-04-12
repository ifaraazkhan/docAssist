"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { login } from "@/lib/api";
import { saveDoctor } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      saveDoctor(res.doctor);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-30%] w-[500px] h-[500px] rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[400px] h-[400px] rounded-full bg-teal-400/10 blur-3xl" />
        <div className="absolute top-[30%] left-[10%] w-[200px] h-[200px] rounded-full bg-emerald-300/5 blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col max-w-lg mx-auto w-full px-6">
        {/* Logo section */}
        <div className="pt-16 pb-8 animate-fade-in">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/10">
            <Stethoscope size={28} className="text-brand-200" />
          </div>
          <h1 className="font-display text-4xl text-white leading-tight">
            DocAssist
          </h1>
          <p className="text-brand-200/80 mt-2 text-sm leading-relaxed">
            Your WhatsApp clinic assistant.
            <br />
            Automate patient queries. Focus on what matters.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 mb-8 animate-fade-in stagger-2">
          {["Auto-replies", "Smart Triage", "Private Notes", "Protocol Builder"].map(
            (feature) => (
              <span
                key={feature}
                className="text-[11px] px-3 py-1.5 bg-white/10 backdrop-blur-sm text-brand-100 rounded-full border border-white/10"
              >
                <Sparkles size={10} className="inline mr-1 opacity-60" />
                {feature}
              </span>
            )
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-6 shadow-elevated animate-slide-up stagger-3">
          <h2 className="font-display text-lg text-slate-900 mb-1">
            Welcome Back
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Sign in to your DocAssist dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@clinic.in"
                className="input-field"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}

            <button
              type="submit"
              className="btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        {/* Bottom tag */}
        <p className="text-center text-[10px] text-brand-300/50 mt-6 mb-8">
          Built for Indian healthcare professionals
        </p>
      </div>
    </div>
  );
}
