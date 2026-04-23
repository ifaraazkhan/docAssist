/* global React */
const { useState: useStateT2, useEffect: useEffectT2, useRef: useRefT2 } = React;

// ============================================================
// DEMO THEATRE — scrubable timeline of an AI processing event
// ============================================================

const SCENES = [
  {
    key: 'voice',
    label: 'Voice note · Hindi',
    sub: '14-second message → triaged + replied in 1.2s',
    asset: 'voice',
    timeline: [
      { t: 0, at: 'Patient sends', detail: '14s voice in Hindi', status: 'incoming' },
      { t: 0.4, at: 'Whisper-small.in transcription', detail: '"Doctor sahab, raat se 103 fever, sar dukh raha hai bahut"', status: 'thinking' },
      { t: 0.7, at: 'Symptom extraction', detail: 'fever 103°F, severe headache, since night', status: 'thinking' },
      { t: 0.9, at: 'Triage', detail: 'HIGH · 94% conf · in-person within 4hr', status: 'urgent' },
      { t: 1.2, at: 'Reply sent', detail: '"Aap turant clinic aayein. Slot 11:30 AM reserved."', status: 'done' },
    ],
  },
  {
    key: 'image',
    label: 'Image · skin rash',
    sub: 'Photo + Hindi caption → derm protocol in 0.8s',
    asset: 'image',
    timeline: [
      { t: 0, at: 'Patient sends', detail: 'photo + "3 din se aise hi hai"', status: 'incoming' },
      { t: 0.3, at: 'Vision model', detail: 'erythema, papular pattern, forearm', status: 'thinking' },
      { t: 0.5, at: 'Differential', detail: 'allergic contact dermatitis (87%)', status: 'thinking' },
      { t: 0.6, at: 'Triage', detail: 'MEDIUM · monitor 48hr', status: 'medium' },
      { t: 0.8, at: 'Reply sent', detail: '"Cetirizine 10mg raat ko, naya soap avoid karein."', status: 'done' },
    ],
  },
  {
    key: 'lab',
    label: 'Lab PDF · Lal PathLabs',
    sub: 'CBC + lipid → flagged + scheduled in 1.0s',
    asset: 'doc',
    timeline: [
      { t: 0, at: 'Patient sends', detail: 'CBC_lipid_apr20.pdf · 412 KB', status: 'incoming' },
      { t: 0.3, at: 'Parse', detail: 'HbA1c 6.4 · LDL 142 · TG 198', status: 'thinking' },
      { t: 0.5, at: 'Compare to history', detail: 'HbA1c trending up from 5.9 (3mo)', status: 'thinking' },
      { t: 0.7, at: 'Flag', detail: 'PRE-DIABETIC · review needed', status: 'medium' },
      { t: 1.0, at: 'Reply sent', detail: '"Reports received. Dr will call tomorrow morning."', status: 'done' },
    ],
  },
];

function DemoTheatre() {
  const [active, setActive] = useStateT2(0);
  const [scrub, setScrub] = useStateT2(0);
  const [playing, setPlaying] = useStateT2(true);
  const s = SCENES[active];
  const max = 1.4;

  useEffectT2(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setScrub(p => {
        if (p >= max) return 0;
        return Math.min(max, p + 0.04);
      });
    }, 60);
    return () => clearInterval(id);
  }, [playing, active]);

  useEffectT2(() => { setScrub(0); }, [active]);

  const visibleSteps = s.timeline.filter(t => t.t <= scrub);

  return (
    <section id="demo" style={{ padding: '120px 0', background: 'var(--paper-2)', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 24 }}>
          <div style={{ maxWidth: 640 }}>
            <div className="eyebrow" style={{ marginBottom: 18 }}>The theatre</div>
            <h2 className="serif" style={{ fontSize: 'var(--fs-h1)' }}>
              Watch the AI{' '}
              <em className="italic" style={{ color: 'var(--ink-3)' }}>think.</em>
            </h2>
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
            ↳ scrub the timeline · or watch it loop
          </div>
        </div>

        {/* Scene tabs */}
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--ink)', borderBottom: '1px solid var(--rule)', marginBottom: 0 }}>
          {SCENES.map((sc, i) => (
            <button key={sc.key} onClick={() => setActive(i)}
              style={{
                flex: 1, padding: '20px 24px', textAlign: 'left',
                background: active === i ? 'var(--paper)' : 'transparent',
                borderRight: i < SCENES.length - 1 ? '1px solid var(--rule)' : 'none',
                borderTop: active === i ? '2px solid var(--accent)' : '2px solid transparent',
                marginTop: -1,
                color: active === i ? 'var(--ink)' : 'var(--ink-3)',
                transition: 'all 200ms',
              }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', marginBottom: 6, color: 'var(--ink-3)' }}>0{i+1} / 03</div>
              <div className="serif" style={{ fontSize: 22, marginBottom: 4 }}>{sc.label}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{sc.sub}</div>
            </button>
          ))}
        </div>

        {/* Theatre */}
        <div style={{ background: 'var(--paper)', display: 'grid', gridTemplateColumns: '1fr 1.4fr', minHeight: 480 }}>

          {/* LEFT — patient asset */}
          <div style={{ padding: 36, borderRight: '1px solid var(--rule)' }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 18 }}>↳ INPUT</div>
            <Asset kind={s.asset}/>
          </div>

          {/* RIGHT — timeline */}
          <div style={{ padding: 36, display: 'flex', flexDirection: 'column' }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 18 }}>↳ DRCLINIQ AI · {scrub.toFixed(2)}s</div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {s.timeline.map((step, i) => {
                const visible = visibleSteps.includes(step);
                return (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '60px 1fr',
                    gap: 16, padding: '14px 0',
                    borderBottom: '1px solid var(--rule)',
                    opacity: visible ? 1 : 0.18,
                    transition: 'opacity 300ms',
                  }}>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.04em' }}>{step.t.toFixed(1)}s</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{step.at}</span>
                        <StatusPill status={step.status}/>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.4 }}>{step.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scrub bar */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setPlaying(p => !p)} style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--ink)', color: 'var(--paper)',
                  display: 'grid', placeItems: 'center', fontSize: 11,
                }}>{playing ? '❚❚' : '▶'}</button>
                <div style={{ flex: 1, position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'var(--rule)' }}/>
                  <div style={{ position: 'absolute', left: 0, width: `${(scrub/max)*100}%`, height: 2, background: 'var(--accent)' }}/>
                  <input type="range" min="0" max={max} step="0.02" value={scrub}
                    onChange={(e) => { setScrub(Number(e.target.value)); setPlaying(false); }}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', cursor: 'grab' }}/>
                  <div style={{
                    position: 'absolute', left: `calc(${(scrub/max)*100}% - 7px)`,
                    width: 14, height: 14, borderRadius: '50%',
                    background: 'var(--accent)', border: '2px solid var(--paper)', boxShadow: 'var(--shadow-sm)',
                    pointerEvents: 'none',
                  }}/>
                </div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{scrub.toFixed(2)} / {max.toFixed(2)}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusPill({ status }) {
  const map = {
    incoming: { bg: 'var(--paper-3)', c: 'var(--ink-3)', t: 'IN' },
    thinking: { bg: 'oklch(0.92 0.04 270)', c: 'oklch(0.45 0.14 270)', t: 'AI' },
    urgent: { bg: 'oklch(0.92 0.06 25)', c: 'oklch(0.50 0.16 25)', t: 'HIGH' },
    medium: { bg: 'var(--saffron-soft)', c: 'oklch(0.50 0.12 55)', t: 'MED' },
    done: { bg: 'var(--accent-soft)', c: 'var(--emerald-deep)', t: 'SENT' },
  };
  const p = map[status];
  return (
    <span className="mono" style={{
      fontSize: 9, letterSpacing: '0.08em',
      background: p.bg, color: p.c,
      padding: '2px 7px', borderRadius: 4,
    }}>{p.t}</span>
  );
}

function Asset({ kind }) {
  if (kind === 'voice') {
    return (
      <div style={{ background: '#dcf8c6', padding: 16, borderRadius: 12, color: '#111', maxWidth: 320, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#075e54', color: 'white', display: 'grid', placeItems: 'center' }}>▶</div>
          <div style={{ flex: 1 }}>
            <svg viewBox="0 0 200 24" width="100%" height="24">
              {Array.from({ length: 30 }).map((_, i) => (
                <rect key={i} x={i*7} y={12 - Math.abs(Math.sin(i*0.7)*9)} width="3" height={Math.abs(Math.sin(i*0.7)*18)} fill="#075e54"/>
              ))}
            </svg>
          </div>
        </div>
        <div className="mono" style={{ fontSize: 10, color: '#666' }}>0:14 · Hindi</div>
      </div>
    );
  }
  if (kind === 'image') {
    return (
      <div style={{ background: 'white', padding: 6, borderRadius: 12, maxWidth: 280, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{
          aspectRatio: '4/3',
          background: 'repeating-linear-gradient(45deg, oklch(0.78 0.06 30), oklch(0.78 0.06 30) 8px, oklch(0.72 0.07 30) 8px, oklch(0.72 0.07 30) 16px)',
          borderRadius: 8,
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(0,0,0,0.5)',
        }}>[ rash photo ]</div>
        <div style={{ padding: '10px 4px 4px', fontSize: 12, color: '#444' }}>"Ye dekho doctor, 3 din se aise hi hai"</div>
      </div>
    );
  }
  return (
    <div style={{ background: 'white', padding: 16, borderRadius: 12, maxWidth: 320, display: 'flex', gap: 14, alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ width: 44, height: 56, background: '#e74c3c', borderRadius: 4, display: 'grid', placeItems: 'center', color: 'white', fontSize: 11, fontFamily: 'var(--mono)' }}>PDF</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>CBC_lipid_apr20.pdf</div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>412 KB · Lal Path Labs</div>
      </div>
    </div>
  );
}

window.DemoTheatre = DemoTheatre;
