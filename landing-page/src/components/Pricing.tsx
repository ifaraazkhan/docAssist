'use client';

import { useState } from 'react';

export default function Pricing() {
  const [vol, setVol] = useState(40);
  const tier = vol < 15 ? 0 : vol < 60 ? 1 : 2;

  const tiers = [
    {
      name: 'Free',
      price: 0,
      suffix: 'forever',
      tag: 'Solo doctors getting started',
      features: ['3 protocols', '50 messages/day', 'Hindi + English', 'Basic inbox', 'Email support'],
      cta: 'Start free',
    },
    {
      name: 'Pro',
      price: 499,
      suffix: '/month',
      tag: 'Clinics that want full control',
      features: ['Unlimited protocols', 'Unlimited messages', 'Custom keywords', 'Image + doc support', 'Prescription auto-send', 'Day 3/7 follow-ups', 'Priority support'],
      cta: 'Get Pro',
    },
    {
      name: 'Clinic+',
      price: 999,
      suffix: '/month',
      tag: 'AI-powered clinic automation',
      features: ['Everything in Pro', 'AI triage + voice notes', 'Lab report parsing', 'Morning briefing', 'Analytics + benchmarks', 'Up to 5 team accounts', 'Dedicated success manager'],
      cta: 'Get Clinic+',
    },
  ];

  return (
    <section id="pricing" style={{ padding: '80px 0' }}>
      <div className="container-ed">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="eyebrow mb-4 justify-center">Pricing</div>
          <h2 className="serif mb-3" style={{ fontSize: 'var(--fs-h1)' }}>
            Less than your daily{' '}
            <em className="italic" style={{ color: 'var(--accent)' }}>chai budget.</em>
          </h2>
          <p style={{ fontSize: 17, color: 'var(--ink-2)' }}>
            Tell us your volume. We&apos;ll point at the right tier — no hard sell.
          </p>
        </div>

        {/* Volume slider */}
        <div
          className="max-w-xl mx-auto mb-14 p-6 rounded-2xl"
          style={{ background: 'var(--paper-2)', border: '1px solid var(--rule)' }}
        >
          <div className="flex justify-between items-baseline mb-3.5">
            <span className="mono uppercase" style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
              Patients you see per day
            </span>
            <span className="serif" style={{ fontSize: 32 }}>
              {vol}{vol === 150 ? '+' : ''}
            </span>
          </div>
          <div className="relative h-6 flex items-center">
            <div className="absolute inset-y-[11px] inset-x-0" style={{ background: 'var(--rule)' }} />
            <div className="absolute left-0 h-0.5" style={{ width: `${(vol / 150) * 100}%`, background: 'var(--accent)' }} />
            <input
              type="range" min="5" max="150" value={vol}
              onChange={(e) => setVol(Number(e.target.value))}
              className="absolute inset-0 opacity-0 w-full cursor-grab"
            />
            <div
              className="absolute pointer-events-none rounded-full"
              style={{
                left: `calc(${(vol / 150) * 100}% - 9px)`,
                width: 18, height: 18,
                background: 'var(--paper)',
                border: '2px solid var(--ink)',
              }}
            />
          </div>
          <div className="mono mt-4 text-center" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
            ↳ recommended: <span className="font-medium" style={{ color: 'var(--accent)' }}>{tiers[tier].name}</span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {tiers.map((t, i) => {
            const recommended = i === tier;
            return (
              <div
                key={t.name}
                className="relative flex flex-col gap-5 p-7 md:p-8 rounded-2xl transition-all duration-250"
                style={{
                  border: recommended ? '1.5px solid var(--accent)' : '1px solid var(--rule)',
                  background: 'var(--paper)',
                  transform: recommended ? 'translateY(-12px)' : 'none',
                  boxShadow: recommended ? 'var(--shadow-lg)' : 'none',
                }}
              >
                {recommended && (
                  <div
                    className="absolute -top-3 left-8 mono uppercase rounded-full"
                    style={{
                      background: 'var(--accent)',
                      color: 'white',
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      padding: '4px 10px',
                    }}
                  >
                    Recommended for you
                  </div>
                )}

                <div>
                  <div className="text-xl font-medium mb-1">{t.name}</div>
                  <div className="text-sm" style={{ color: 'var(--ink-3)' }}>{t.tag}</div>
                </div>

                <div className="flex items-baseline gap-1.5 pb-2" style={{ borderBottom: '1px solid var(--rule)' }}>
                  <span className="serif" style={{ fontSize: 'clamp(40px, 5vw, 56px)' }}>₹{t.price}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t.suffix}</span>
                </div>

                <ul className="flex flex-col gap-2.5 flex-1" style={{ listStyle: 'none', padding: 0, fontSize: 13.5 }}>
                  {t.features.map(f => (
                    <li key={f} className="flex gap-2.5 items-start">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" className="mt-0.5 shrink-0"><path d="M20 6L9 17l-5-5" /></svg>
                      <span style={{ color: 'var(--ink-2)' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#signup"
                  className={`btn-ed ${recommended ? 'btn-accent-ed' : 'btn-ghost-ed'} justify-center`}
                  style={{ padding: '14px 20px', fontSize: 14 }}
                >
                  {t.cta} →
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
