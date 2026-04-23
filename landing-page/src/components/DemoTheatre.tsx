'use client';

import { useState, useEffect } from 'react';

const SCENES = [
  {
    key: 'voice',
    label: 'Voice note · Hindi',
    sub: '14-second message → triaged + replied in 1.2s',
    asset: 'voice' as const,
    timeline: [
      { t: 0, at: 'Patient sends', detail: '14s voice in Hindi', status: 'incoming' as const },
      { t: 0.4, at: 'Whisper-small.in transcription', detail: '"Doctor sahab, raat se 103 fever, sar dukh raha hai bahut"', status: 'thinking' as const },
      { t: 0.7, at: 'Symptom extraction', detail: 'fever 103°F, severe headache, since night', status: 'thinking' as const },
      { t: 0.9, at: 'Triage', detail: 'HIGH · 94% conf · in-person within 4hr', status: 'urgent' as const },
      { t: 1.2, at: 'Reply sent', detail: '"Aap turant clinic aayein. Slot 11:30 AM reserved."', status: 'done' as const },
    ],
  },
  {
    key: 'image',
    label: 'Image · skin rash',
    sub: 'Photo + Hindi caption → derm protocol in 0.8s',
    asset: 'image' as const,
    timeline: [
      { t: 0, at: 'Patient sends', detail: 'photo + "3 din se aise hi hai"', status: 'incoming' as const },
      { t: 0.3, at: 'Vision model', detail: 'erythema, papular pattern, forearm', status: 'thinking' as const },
      { t: 0.5, at: 'Differential', detail: 'allergic contact dermatitis (87%)', status: 'thinking' as const },
      { t: 0.6, at: 'Triage', detail: 'MEDIUM · monitor 48hr', status: 'medium' as const },
      { t: 0.8, at: 'Reply sent', detail: '"Cetirizine 10mg raat ko, naya soap avoid karein."', status: 'done' as const },
    ],
  },
  {
    key: 'lab',
    label: 'Lab PDF · Lal PathLabs',
    sub: 'CBC + lipid → flagged + scheduled in 1.0s',
    asset: 'doc' as const,
    timeline: [
      { t: 0, at: 'Patient sends', detail: 'CBC_lipid_apr20.pdf · 412 KB', status: 'incoming' as const },
      { t: 0.3, at: 'Parse', detail: 'HbA1c 6.4 · LDL 142 · TG 198', status: 'thinking' as const },
      { t: 0.5, at: 'Compare to history', detail: 'HbA1c trending up from 5.9 (3mo)', status: 'thinking' as const },
      { t: 0.7, at: 'Flag', detail: 'PRE-DIABETIC · review needed', status: 'medium' as const },
      { t: 1.0, at: 'Reply sent', detail: '"Reports received. Dr will call tomorrow morning."', status: 'done' as const },
    ],
  },
];

type Status = 'incoming' | 'thinking' | 'urgent' | 'medium' | 'done';

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { bg: string; c: string; t: string }> = {
    incoming: { bg: 'var(--paper-3)', c: 'var(--ink-3)', t: 'IN' },
    thinking: { bg: 'oklch(0.92 0.04 270)', c: 'oklch(0.45 0.14 270)', t: 'AI' },
    urgent: { bg: 'oklch(0.92 0.06 25)', c: 'oklch(0.50 0.16 25)', t: 'HIGH' },
    medium: { bg: 'var(--saffron-soft)', c: 'oklch(0.50 0.12 55)', t: 'MED' },
    done: { bg: 'var(--accent-soft)', c: 'var(--emerald-deep)', t: 'SENT' },
  };
  const p = map[status];
  return (
    <span className="mono rounded" style={{ fontSize: 9, letterSpacing: '0.08em', background: p.bg, color: p.c, padding: '2px 7px' }}>
      {p.t}
    </span>
  );
}

function Asset({ kind }: { kind: 'voice' | 'image' | 'doc' }) {
  if (kind === 'voice') {
    return (
      <div className="rounded-xl" style={{ background: '#dcf8c6', padding: 16, color: '#111', maxWidth: 320 }}>
        <div className="flex items-center gap-3 mb-1.5">
          <div className="grid place-items-center rounded-full text-white" style={{ width: 36, height: 36, background: '#075e54' }}>▶</div>
          <div className="flex-1">
            <div className="flex gap-0.5">
              {Array.from({ length: 28 }).map((_, i) => (
                <div key={i} className="rounded-full" style={{ width: 2, height: 4 + Math.sin(i * 0.8) * 8 + Math.random() * 6, background: '#075e54', opacity: 0.6 + Math.random() * 0.4 }} />
              ))}
            </div>
          </div>
          <span style={{ fontSize: 11, color: '#555' }}>0:14</span>
        </div>
        <div style={{ fontSize: 9, color: '#888', textAlign: 'right' }}>9:46</div>
      </div>
    );
  }
  if (kind === 'image') {
    return (
      <div className="rounded-xl overflow-hidden" style={{ background: '#dcf8c6', maxWidth: 280 }}>
        <div className="grid place-items-center" style={{ height: 200, background: 'linear-gradient(135deg, #ffccc4, #ffd4c4)', color: '#b44', fontSize: 48 }}>🩹</div>
        <div style={{ padding: '8px 12px', fontSize: 13, color: '#111' }}>&ldquo;3 din se aise hi hai&rdquo;</div>
        <div style={{ padding: '0 12px 8px', fontSize: 9, color: '#888', textAlign: 'right' }}>9:46</div>
      </div>
    );
  }
  return (
    <div className="rounded-xl" style={{ background: '#dcf8c6', padding: 14, maxWidth: 280 }}>
      <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.6)' }}>
        <div className="grid place-items-center rounded-lg" style={{ width: 44, height: 44, background: '#e74c3c', color: 'white', fontSize: 11, fontWeight: 700 }}>PDF</div>
        <div className="flex-1">
          <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>CBC_lipid_apr20.pdf</div>
          <div style={{ fontSize: 11, color: '#666' }}>412 KB · Lal PathLabs</div>
        </div>
      </div>
      <div style={{ fontSize: 9, color: '#888', textAlign: 'right', marginTop: 6 }}>9:46</div>
    </div>
  );
}

export default function DemoTheatre() {
  const [active, setActive] = useState(0);
  const [scrub, setScrub] = useState(0);
  const [playing, setPlaying] = useState(true);
  const s = SCENES[active];
  const max = 1.4;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setScrub(p => {
        if (p >= max) return 0;
        return Math.min(max, p + 0.04);
      });
    }, 60);
    return () => clearInterval(id);
  }, [playing, active]);

  useEffect(() => {
    setScrub(0);
  }, [active]);

  const visibleSteps = s.timeline.filter(t => t.t <= scrub);

  return (
    <section
      id="demo"
      style={{
        padding: '80px 0',
        background: 'var(--paper-2)',
        borderTop: '1px solid var(--rule)',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <div className="container-ed">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-6">
          <div className="max-w-xl">
            <div className="eyebrow mb-4">The theatre</div>
            <h2 className="serif" style={{ fontSize: 'var(--fs-h1)' }}>
              Watch the AI{' '}
              <em className="italic" style={{ color: 'var(--ink-3)' }}>think.</em>
            </h2>
          </div>
          <div className="mono hidden sm:block" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
            ↳ scrub the timeline · or watch it loop
          </div>
        </div>

        {/* Scene tabs */}
        <div className="flex flex-col sm:flex-row" style={{ borderTop: '1px solid var(--ink)', borderBottom: '1px solid var(--rule)' }}>
          {SCENES.map((sc, i) => (
            <button
              key={sc.key}
              onClick={() => setActive(i)}
              className="flex-1 text-left transition-all duration-200"
              style={{
                padding: '20px 24px',
                background: active === i ? 'var(--paper)' : 'transparent',
                borderRight: i < SCENES.length - 1 ? '1px solid var(--rule)' : 'none',
                borderTop: active === i ? '2px solid var(--accent)' : '2px solid transparent',
                marginTop: -1,
                color: active === i ? 'var(--ink)' : 'var(--ink-3)',
              }}
            >
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', marginBottom: 6, color: 'var(--ink-3)' }}>
                0{i + 1} / 03
              </div>
              <div className="serif" style={{ fontSize: 20, marginBottom: 4 }}>{sc.label}</div>
              <div className="text-xs" style={{ color: 'var(--ink-3)' }}>{sc.sub}</div>
            </button>
          ))}
        </div>

        {/* Theatre body */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr]" style={{ background: 'var(--paper)', minHeight: 420 }}>
          {/* LEFT — asset */}
          <div className="p-6 md:p-9" style={{ borderRight: '1px solid var(--rule)' }}>
            <div className="mono mb-4" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)' }}>↳ INPUT</div>
            <Asset kind={s.asset} />
          </div>

          {/* RIGHT — timeline */}
          <div className="p-6 md:p-9 flex flex-col">
            <div className="mono mb-4" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)' }}>
              ↳ DRCLINIQ AI · {scrub.toFixed(2)}s
            </div>

            <div className="flex-1 flex flex-col">
              {s.timeline.map((step, i) => {
                const visible = visibleSteps.includes(step);
                return (
                  <div
                    key={i}
                    className="grid grid-cols-[50px_1fr] gap-4 py-3.5 transition-opacity duration-300"
                    style={{
                      borderBottom: '1px solid var(--rule)',
                      opacity: visible ? 1 : 0.18,
                    }}
                  >
                    <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.04em' }}>{step.t.toFixed(1)}s</div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium">{step.at}</span>
                        <StatusPill status={step.status} />
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.4 }}>{step.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scrub bar */}
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPlaying(p => !p)}
                  className="grid place-items-center rounded-full shrink-0"
                  style={{ width: 36, height: 36, background: 'var(--ink)', color: 'var(--paper)', fontSize: 11 }}
                >
                  {playing ? '❚❚' : '▶'}
                </button>
                <div className="flex-1 relative h-6 flex items-center">
                  <div className="absolute left-0 right-0 h-0.5" style={{ background: 'var(--rule)' }} />
                  <div className="absolute left-0 h-0.5" style={{ width: `${(scrub / max) * 100}%`, background: 'var(--accent)' }} />
                  <input
                    type="range" min="0" max={max} step="0.02" value={scrub}
                    onChange={(e) => { setScrub(Number(e.target.value)); setPlaying(false); }}
                    className="absolute inset-0 opacity-0 w-full cursor-grab"
                  />
                  <div
                    className="absolute pointer-events-none rounded-full"
                    style={{
                      left: `calc(${(scrub / max) * 100}% - 7px)`,
                      width: 14, height: 14,
                      background: 'var(--accent)',
                      border: '2px solid var(--paper)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  />
                </div>
                <span className="mono shrink-0" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  {scrub.toFixed(2)} / {max.toFixed(2)}s
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
