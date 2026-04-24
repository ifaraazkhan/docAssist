'use client';

import { useState, useMemo } from 'react';

function Slider({ label, value, min, max, step, onChange, unit }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; unit: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mb-7">
      <div className="flex justify-between items-baseline mb-2.5">
        <span className="mono uppercase" style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--ink-3)' }}>{label}</span>
        <span className="serif" style={{ fontSize: 28, color: 'var(--ink)' }}>
          {unit === '₹/hr' ? `₹${value.toLocaleString('en-IN')}` : value}
          {unit !== '₹/hr' && <span className="mono ml-1" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{unit}</span>}
        </span>
      </div>
      <div className="relative h-7 flex items-center">
        <div className="absolute left-0 right-0 h-0.5" style={{ background: 'var(--rule)' }} />
        <div className="absolute left-0 h-0.5" style={{ width: `${pct}%`, background: 'var(--ink)' }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute left-0 right-0 w-full opacity-0 cursor-grab h-7 m-0"
        />
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `calc(${pct}% - 9px)`,
            width: 18, height: 18,
            background: 'var(--paper)',
            border: '2px solid var(--ink)',
          }}
        />
      </div>
    </div>
  );
}

function Row({ k, v, sub, highlight }: { k: string; v: string; sub: string; highlight?: boolean }) {
  return (
    <div
      className="grid grid-cols-[1fr_auto] items-center py-3.5"
      style={{
        borderBottom: '1px solid oklch(0.32 0.012 250)',
        color: highlight ? 'var(--accent)' : 'var(--paper)',
      }}
    >
      <div>
        <div className="text-sm font-medium">{k}</div>
        <div className="mono mt-0.5" style={{ fontSize: 11, color: 'oklch(0.65 0.01 95)', letterSpacing: '0.04em' }}>{sub}</div>
      </div>
      <div className="serif text-xl">{v}</div>
    </div>
  );
}

export default function Calculator() {
  const [patients, setPatients] = useState(40);
  const [whatsappPct, setWhatsappPct] = useState(60);
  const [hourly, setHourly] = useState(2000);

  const numbers = useMemo(() => {
    const msgsPerDay = Math.round(patients * whatsappPct / 100 * 4);
    const minsPerMsg = 1.5;
    const minsSavedPerDay = Math.round(msgsPerDay * minsPerMsg * 0.85);
    const hoursPerMonth = Math.round(minsSavedPerDay * 26 / 60);
    const moneyPerMonth = Math.round(hoursPerMonth * hourly);
    const noShowSaved = Math.round(patients * 26 * 0.38 * 0.18 * (hourly * 0.7));
    const total = moneyPerMonth + noShowSaved;
    return { msgsPerDay, minsSavedPerDay, hoursPerMonth, moneyPerMonth, noShowSaved, total };
  }, [patients, whatsappPct, hourly]);

  return (
    <section id="math" className="relative" style={{ padding: '80px 0' }}>
      <div className="container-ed">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16 items-start">
          <div>
            <div className="eyebrow mb-4">Do the math</div>
            <h2 className="mb-5" style={{ fontSize: 'var(--fs-h1)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              How much is{' '}
              <span style={{ color: 'var(--accent)' }}>your</span>{' '}
              WhatsApp costing you?
            </h2>
            <p className="mb-8" style={{ fontSize: 17, color: 'var(--ink-2)', maxWidth: 480, lineHeight: 1.55 }}>
              Three sliders. No email gate. Your savings depend on patient volume, what they message about, and what your time is worth.
            </p>

            <Slider label="Patients per day" value={patients} min={5} max={150} step={1} onChange={setPatients} unit="patients" />
            <Slider label="What % message you on WhatsApp" value={whatsappPct} min={10} max={100} step={5} onChange={setWhatsappPct} unit="%" />
            <Slider label="Your hourly time worth" value={hourly} min={500} max={8000} step={100} onChange={setHourly} unit="₹/hr" />

            <div className="mono mt-6" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.04em', maxWidth: 380 }}>
              ≈ {numbers.msgsPerDay} messages/day · {numbers.minsSavedPerDay} mins reclaimed daily · {numbers.hoursPerMonth} hrs/month
            </div>
          </div>

          {/* Result panel */}
          <div
            className="rounded-2xl p-8 lg:p-10 lg:sticky lg:top-24"
            style={{
              background: 'var(--ink)',
              color: 'var(--paper)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="mono mb-3" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'oklch(0.65 0.01 95)' }}>
              ESTIMATED RECOVERY · MONTHLY
            </div>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="serif" style={{ fontSize: 'clamp(56px, 8vw, 96px)', color: 'var(--accent)', lineHeight: 1 }}>
                ₹{Math.round(numbers.total / 1000)}k
              </span>
              <span className="mono" style={{ fontSize: 12, color: 'oklch(0.7 0.01 95)' }}>/ month</span>
            </div>

            <div className="flex flex-col" style={{ borderTop: '1px solid oklch(0.32 0.012 250)' }}>
              <Row k="Time reclaimed" v={`${numbers.hoursPerMonth} hrs/mo`} sub={`= ₹${numbers.moneyPerMonth.toLocaleString('en-IN')}`} />
              <Row k="No-shows recovered" v="38% reduction" sub={`= ₹${numbers.noShowSaved.toLocaleString('en-IN')}`} />
              <Row k="DrCliniq cost" v="₹999 / mo" sub="Clinic+ tier" highlight />
            </div>

            <div className="mt-6 p-4 rounded-lg" style={{ background: 'oklch(0.21 0.012 250)', fontSize: 13, color: 'oklch(0.85 0.01 95)' }}>
              <span style={{ color: 'var(--accent)' }}>↳</span> You&apos;d net <strong>₹{(numbers.total - 999).toLocaleString('en-IN')}/month</strong> by Friday.
            </div>

            <div className="mono mt-3" style={{ fontSize: 10, color: 'oklch(0.6 0.01 95)', letterSpacing: '0.06em', lineHeight: 1.5 }}>
              ★ Estimates based on your inputs. Representational only; real results vary.
            </div>

            <a href="#signup" className="btn-ed btn-accent-ed mt-5 w-full justify-center" style={{ padding: 14 }}>
              Start clawing it back →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
