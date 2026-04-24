'use client';

import { useState } from 'react';

export default function FinalCTA() {
  const [phone, setPhone] = useState('');
  const [done, setDone] = useState(false);

  return (
    <section
      id="signup"
      className="relative overflow-hidden"
      style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '100px 0' }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          opacity: 0.05,
          backgroundImage: 'linear-gradient(var(--paper) 1px, transparent 1px), linear-gradient(90deg, var(--paper) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="container-ed relative text-center max-w-3xl mx-auto">
        <div className="eyebrow justify-center mb-4" style={{ color: 'oklch(0.7 0.02 95)' }}>
          <span className="live-dot" /> One last thing
        </div>

        <h2 className="mb-6" style={{ fontSize: 'var(--fs-h1)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          You won&apos;t redesign WhatsApp.<br />
          <span style={{ color: 'var(--accent)' }}>You can teach it medicine.</span>
        </h2>

        <p className="mx-auto mb-10" style={{ fontSize: 17, color: 'oklch(0.75 0.01 95)', maxWidth: 540 }}>
          One number. Ten digits. We&apos;ll WhatsApp you a setup link in under 30 seconds.
        </p>

        {!done ? (
          <form
            onSubmit={(e) => { e.preventDefault(); if (phone.length >= 10) setDone(true); }}
            className="flex flex-col sm:flex-row max-w-lg mx-auto gap-3 sm:gap-0"
          >
            <div
              className="flex items-stretch flex-1 rounded-full sm:rounded-r-none"
              style={{
                background: 'oklch(0.22 0.012 250)',
                border: '1px solid oklch(0.32 0.012 250)',
                padding: 5,
              }}
            >
              <div
                className="flex items-center mono shrink-0"
                style={{ padding: '0 16px', color: 'oklch(0.7 0.02 95)', fontSize: 13, borderRight: '1px solid oklch(0.32 0.012 250)' }}
              >
                🇮🇳 +91
              </div>
              <input
                type="tel"
                value={phone}
                aria-label="Enter your phone number"
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98765 43210"
                className="flex-1 border-none outline-none bg-transparent mono min-w-0"
                style={{ padding: 14, fontSize: 15, color: 'var(--paper)', letterSpacing: '0.04em' }}
              />
            </div>
            <button
              type="submit"
              className="btn-ed btn-accent-ed sm:rounded-l-none justify-center"
              style={{ padding: '12px 22px' }}
            >
              Send setup link
            </button>
          </form>
        ) : (
          <div
            className="flex gap-3 items-center text-left rounded-2xl max-w-md mx-auto"
            style={{
              background: 'var(--accent-soft)',
              color: 'var(--emerald-deep)',
              padding: 16,
              animation: 'fadeUp 400ms cubic-bezier(.2,.8,.2,1) both',
            }}
          >
            <div className="grid place-items-center rounded-full shrink-0" style={{ width: 36, height: 36, background: 'var(--accent)', color: 'white' }}>✓</div>
            <div>
              <div className="font-medium">Setup link sent to +91 {phone}</div>
              <div className="text-xs opacity-85">Check WhatsApp in ~30 seconds.</div>
            </div>
          </div>
        )}

        <div className="mt-3 text-xs" style={{ color: 'oklch(0.6 0.02 95)' }}>
          No credit card required. Free plan available forever.
        </div>

        <div className="flex flex-wrap gap-10 sm:gap-14 mt-16 justify-center">
          {[
            { n: '<2s', l: 'AI reply time' },
            { n: '50+', l: 'ready-made protocols' },
            { n: '₹0', l: 'to get started' },
            { n: 'Made', l: 'for Indian practice' },
          ].map(s => (
            <div key={s.l}>
              <div className="serif" style={{ fontSize: 'clamp(32px, 4vw, 40px)' }}>{s.n}</div>
              <div className="mono" style={{ fontSize: 11, color: 'oklch(0.6 0.02 95)', letterSpacing: '0.06em', marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
