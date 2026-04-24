'use client';

import { useState, useEffect } from 'react';
import { useISTClock } from '@/lib/hooks';

const FEED = [
  { city: 'Lucknow', spec: 'Pediatrics', msg: 'fever 102 in 4yr son, what to do?', lang: 'hi' },
  { city: 'Pune', spec: 'GP', msg: 'Sir aaj appointment hai kya?', lang: 'hi' },
  { city: 'Chennai', spec: 'Cardiology', msg: 'BP reading 148/96 — concerning?', lang: 'en' },
  { city: 'Hyderabad', spec: 'Diabetes', msg: 'Sugar 320 fasting, scared', lang: 'en' },
  { city: 'Mumbai', spec: 'Derma', msg: 'rash photo attached, 3 days', lang: 'hi' },
  { city: 'Kolkata', spec: 'GP', msg: 'voice note · 14s · cough query', lang: 'hi' },
  { city: 'Delhi', spec: 'Pediatrics', msg: 'baby vomiting, what dose calpol?', lang: 'en' },
  { city: 'Jaipur', spec: 'GP', msg: 'kab khaali hai aapka clinic?', lang: 'hi' },
  { city: 'Ahmedabad', spec: 'Gyn', msg: 'follow-up date confirm karwana hai', lang: 'hi' },
  { city: 'Kochi', spec: 'ENT', msg: 'sore throat, fever, since morning', lang: 'en' },
];

export default function PainSection() {
  const { time, after } = useISTClock();
  const [feed, setFeed] = useState(() => FEED.slice(0, 5).map((f, i) => ({ ...f, ts: Date.now() + i })));
  const [missed, setMissed] = useState(1284);

  useEffect(() => {
    const id = setInterval(() => {
      const next = FEED[Math.floor(Math.random() * FEED.length)];
      setFeed(f => [{ ...next, ts: Date.now() }, ...f].slice(0, 6));
      setMissed(m => m + Math.floor(Math.random() * 3) + 1);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const tone = after
    ? { kicker: "It's after-hours.", body: "Your clinic is closed. Your patients are not." }
    : { kicker: "It's clinic hours.", body: "And the WhatsApp is already overflowing." };

  return (
    <section
      id="pain"
      className="relative overflow-hidden"
      style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '80px 0 80px' }}
    >
      <div className="container-ed">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* LEFT: time-aware pain */}
          <div>
            <div className="mono mb-4" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--accent)' }}>
              <span className="live-dot mr-2 align-middle" />
              IST {time} · LIVE
            </div>

            <h2 className="mb-5" style={{ fontSize: 'var(--fs-h1)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05, color: 'var(--paper)' }}>
              {tone.kicker}<br />
              <span style={{ color: 'oklch(0.55 0.02 95)' }}>{tone.body}</span>
            </h2>

            <p className="mb-8" style={{ fontSize: 17, color: 'oklch(0.78 0.01 95)', maxWidth: 480, lineHeight: 1.55 }}>
              While you read this, doctors across India are watching messages pile up.
              Most will go unanswered until tomorrow morning. Some until never.
            </p>

            <div className="flex flex-col sm:flex-row gap-8 pt-6" style={{ borderTop: '1px solid oklch(0.32 0.012 250)' }}>
              <div>
                <div className="serif" style={{ fontSize: 'clamp(40px, 6vw, 56px)', color: 'var(--accent)' }}>
                  {missed.toLocaleString('en-IN')}
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'oklch(0.65 0.01 95)', letterSpacing: '0.06em', marginTop: 4 }}>
                  messages waiting · across India · right now
                </div>
              </div>
              <div>
                <div className="serif" style={{ fontSize: 'clamp(40px, 6vw, 56px)' }}>3 hrs</div>
                <div className="mono" style={{ fontSize: 11, color: 'oklch(0.65 0.01 95)', letterSpacing: '0.06em', marginTop: 4 }}>
                  your evening · gone again
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: live feed */}
          <div
            className="rounded-2xl overflow-hidden mono"
            style={{
              background: 'oklch(0.21 0.012 250)',
              border: '1px solid oklch(0.32 0.012 250)',
              fontSize: 12,
            }}
          >
            <div
              className="flex justify-between px-4 py-3"
              style={{
                borderBottom: '1px solid oklch(0.32 0.012 250)',
                color: 'oklch(0.65 0.01 95)',
                fontSize: 10,
                letterSpacing: '0.12em',
              }}
            >
              <span className="hidden sm:inline">↳ INCOMING · INDIA · LAST 60 SEC · ILLUSTRATIVE</span>
              <span className="sm:hidden">↳ INCOMING · LIVE</span>
              <span><span className="live-dot mr-1.5 align-middle" /> LIVE</span>
            </div>

            <div>
              {feed.map((f, i) => (
                <div
                  key={f.ts}
                  className="flex gap-3 items-center px-4 py-3.5"
                  style={{
                    borderBottom: '1px solid oklch(0.26 0.012 250)',
                    animation: i === 0 ? 'fadeUp 400ms cubic-bezier(.2,.8,.2,1) both' : 'none',
                    opacity: 1 - (i * 0.12),
                  }}
                >
                  <div className="hidden sm:block shrink-0" style={{ minWidth: 70, color: 'var(--accent)', fontSize: 11 }}>{f.city}</div>
                  <div className="hidden md:block shrink-0" style={{ minWidth: 80, color: 'oklch(0.6 0.01 95)', fontSize: 10 }}>{f.spec}</div>
                  <div className="flex-1 truncate" style={{ color: 'oklch(0.92 0.01 95)', fontFamily: 'var(--sans)', fontSize: 13 }}>
                    &ldquo;{f.msg}&rdquo;
                  </div>
                  <div className="shrink-0" style={{ fontSize: 9, color: 'oklch(0.55 0.01 95)', letterSpacing: '0.08em' }}>{f.lang.toUpperCase()}</div>
                </div>
              ))}
            </div>

            <div
              className="px-4 py-2.5"
              style={{
                background: 'oklch(0.18 0.012 250)',
                fontSize: 10,
                letterSpacing: '0.08em',
                color: 'oklch(0.55 0.01 95)',
              }}
            >
              ↑ DrCliniq is replying to {(847 + Math.floor(missed / 4)).toLocaleString('en-IN')} of these in real time.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
