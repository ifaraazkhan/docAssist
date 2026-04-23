'use client';

import { useState, useEffect, useRef } from 'react';

const SCRIPT = [
  { from: 'p' as const, t: 700, text: 'Doctor sahab, mere bete ko subah se 102 fever hai 🥲', meta: 'detected: hi-IN' },
  { from: 'a-think' as const, t: 600, text: 'classifying · age · risk · protocol' },
  { from: 'a' as const, t: 800, text: 'Namaste! Bachhe ki age batayein? Kab se fever hai?', tag: 'pediatric_fever_v3' },
  { from: 'p' as const, t: 1000, text: '4 saal. Subah 6 baje se. Halki cough bhi hai.' },
  { from: 'a-think' as const, t: 500, text: 'triage → MEDIUM · slot found' },
  { from: 'a' as const, t: 1000, text: '4 saal ke liye:\n• Paracetamol 250mg syrup, 5ml every 6hr\n• ORS hourly sips\n• Sponge if temp > 102°F\n\nDr Mehta has 4:30 PM open. Confirm?' },
  { from: 'p' as const, t: 900, text: 'Confirm 🙏' },
  { from: 'sys' as const, t: 600, text: 'Booked · Today 4:30 PM · Reminder set' },
];

type ScriptItem = typeof SCRIPT[number];

function Msg({ m }: { m: ScriptItem }) {
  if (m.from === 'a-think') {
    return (
      <div
        className="self-center mono"
        style={{
          fontSize: 9.5,
          letterSpacing: '0.06em',
          color: '#888',
          background: 'rgba(255,255,255,0.5)',
          border: '1px dashed rgba(0,0,0,0.18)',
          borderRadius: 6,
          padding: '4px 10px',
          margin: '4px 0',
          animation: 'fadeUp 320ms cubic-bezier(.2,.8,.2,1) both',
        }}
      >
        ⚙ {m.text}
      </div>
    );
  }

  if (m.from === 'sys') {
    return (
      <div
        className="self-center"
        style={{
          fontSize: 11,
          background: '#dcf8c6',
          color: '#075e54',
          borderRadius: 999,
          padding: '6px 14px',
          margin: '8px 0',
          animation: 'fadeUp 320ms cubic-bezier(.2,.8,.2,1) both',
          fontWeight: 500,
        }}
      >
        ✓ {m.text}
      </div>
    );
  }

  const isP = m.from === 'p';
  return (
    <div
      style={{
        alignSelf: isP ? 'flex-end' : 'flex-start',
        maxWidth: '82%',
        animation: 'fadeUp 360ms cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <div
        style={{
          background: isP ? '#dcf8c6' : 'white',
          color: '#111',
          padding: '8px 11px 7px',
          borderRadius: 8,
          boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
          fontSize: 13,
          lineHeight: 1.45,
          whiteSpace: 'pre-wrap',
        }}
      >
        {'tag' in m && m.tag && (
          <div className="mono" style={{ fontSize: 9, letterSpacing: '0.08em', color: 'var(--emerald-deep)', marginBottom: 4, textTransform: 'lowercase' }}>
            {m.tag}
          </div>
        )}
        {m.text}
        <div style={{ fontSize: 9, color: '#888', marginTop: 3, textAlign: 'right' }}>
          9:47 {isP ? '' : '✓✓'}
        </div>
      </div>
      {'meta' in m && m.meta && (
        <div className="mono" style={{ fontSize: 9, color: 'rgba(0,0,0,0.4)', marginTop: 3, textAlign: isP ? 'right' : 'left' }}>
          {m.meta}
        </div>
      )}
    </div>
  );
}

function Dot({ d }: { d: number }) {
  return (
    <span
      style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: '#999',
        animation: `bounce-dot 1s ${d}ms infinite`,
      }}
    />
  );
}

export default function PhoneShowcase() {
  const [step, setStep] = useState(0);
  const [k, setK] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step >= SCRIPT.length) {
      const t = setTimeout(() => {
        setStep(0);
        setK(x => x + 1);
      }, 3000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep(s => s + 1), SCRIPT[step].t);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [step, k]);

  return (
    <div
      className="flex-shrink-0"
      style={{
        width: 300,
        maxWidth: '100%',
        background: '#0d0d0d',
        borderRadius: 40,
        padding: 8,
        boxShadow: '0 60px 120px -50px rgba(20,30,40,0.4), 0 30px 60px -30px rgba(20,30,40,0.25)',
        position: 'relative',
      }}
    >
      {/* Notch */}
      <div
        className="absolute"
        style={{
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 90,
          height: 24,
          background: '#0d0d0d',
          borderRadius: 14,
          zIndex: 5,
        }}
      />

      <div
        className="relative overflow-hidden"
        style={{
          background: '#e5ddd5',
          borderRadius: 34,
          height: 580,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M30 30 L40 40 M60 60 L70 70 M20 70 L30 60' stroke='%23d4ccc4' stroke-width='1' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      >
        {/* WhatsApp header */}
        <div
          className="flex items-center gap-3"
          style={{ background: '#075e54', color: 'white', padding: '46px 14px 12px' }}
        >
          <span className="text-lg">‹</span>
          <div
            className="serif grid place-items-center rounded-full font-semibold"
            style={{ width: 34, height: 34, background: '#dcf8c6', color: '#075e54', fontSize: 14 }}
          >
            P
          </div>
          <div className="flex-1" style={{ lineHeight: 1.2 }}>
            <div className="text-sm font-medium">Priya Sharma</div>
            <div className="flex items-center gap-1.5 text-xs opacity-85">
              <span className="rounded-full" style={{ width: 6, height: 6, background: '#4ade80' }} /> typing…
            </div>
          </div>
          <span className="text-base opacity-80">📞</span>
          <span className="text-base opacity-80">⋮</span>
        </div>

        {/* Date pill */}
        <div className="flex justify-center py-3">
          <div style={{ background: '#e1f3fb', color: '#54656f', padding: '4px 10px', borderRadius: 10, fontSize: 11 }}>
            Today
          </div>
        </div>

        {/* Messages */}
        <div
          ref={ref}
          className="phone-chat flex flex-col gap-1"
          style={{ padding: '6px 10px 72px', height: 'calc(100% - 140px)', overflowY: 'auto', scrollBehavior: 'smooth' }}
        >
          {SCRIPT.slice(0, step).map((m, i) => (
            <Msg key={`${k}-${i}`} m={m} />
          ))}
          {step > 0 && step < SCRIPT.length && SCRIPT[step].from.startsWith('a') && (
            <div className="self-start flex gap-1" style={{ background: 'white', padding: '10px 14px', borderRadius: 10 }}>
              <Dot d={0} /><Dot d={150} /><Dot d={300} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="absolute bottom-0 left-0 right-0 flex gap-2" style={{ padding: 8, background: '#f0f0f0' }}>
          <div
            className="flex-1 flex justify-between rounded-full"
            style={{ background: 'white', padding: '8px 12px', fontSize: 12, color: '#aaa' }}
          >
            <span>Message</span>
            <span>📎</span>
          </div>
          <div
            className="grid place-items-center rounded-full text-white"
            style={{ width: 34, height: 34, background: '#075e54', fontSize: 14 }}
          >
            🎤
          </div>
        </div>
      </div>
    </div>
  );
}
