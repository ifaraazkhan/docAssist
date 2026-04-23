/* global React PhoneShowcase */
const { useState: useStateH2, useEffect: useEffectH2, useRef: useRefH2 } = React;

// ============================================================
// HERO — editorial composition, big serif, phone right with annotations
// ============================================================

const HEADLINES = {
  A: ['The clinic that ', { i: 'replies' }, ' while you are ', { em: 'busy.' }],
  B: ['Stop replying ', { i: '“take Crocin and rest”' }, ' at midnight.'],
  C: ['Built for the way ', { em: 'Indian doctors' }, ' actually practice.'],
};

function Hero({ headlineVariant = 'A' }) {
  const [phone, setPhone] = useStateH2('');
  const [submitted, setSubmitted] = useStateH2(false);
  const head = HEADLINES[headlineVariant] || HEADLINES.A;

  return (
    <section id="hero" style={{ padding: '40px 0 80px', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle grid backdrop */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)',
        backgroundSize: '80px 80px', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
      }}/>

      <div className="container" style={{ position: 'relative' }}>
        {/* Top meta row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--ink-3)' }}>
            <span className="live-dot"/>
            <span className="mono" style={{ letterSpacing: '0.06em' }}>An operating system for Indian clinics · illustrative interface</span>
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>VOL. 02 — APR 2026</div>
        </div>

        {/* Hairline rule */}
        <div style={{ height: 1, background: 'var(--ink)', opacity: 0.85, marginBottom: 56 }}/>

        {/* Two-column composition */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 64, alignItems: 'start' }}>

          {/* LEFT: editorial */}
          <div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 28 }}>
              An Operating System for Solo Practice
            </div>

            <h1 className="serif" style={{ fontSize: 'var(--fs-display)', marginBottom: 36 }}>
              {head.map((p, i) => {
                if (typeof p === 'string') return <span key={i}>{p}</span>;
                if (p.em) return <span key={i} style={{ color: 'var(--accent)' }}>{p.em}</span>;
                if (p.i) return <em key={i} className="italic" style={{ color: 'var(--ink-3)' }}>{p.i}</em>;
                return null;
              })}
            </h1>

            <p style={{ fontSize: 19, color: 'var(--ink-2)', maxWidth: 540, lineHeight: 1.55, marginBottom: 36 }}>
              DrCliniq lives inside the WhatsApp number your patients already use. It triages in Hindi. It sends prescriptions. It books appointments. It wakes you only when it must.
            </p>

            {/* Phone signup */}
            {!submitted ? (
              <form onSubmit={(e) => { e.preventDefault(); if (phone.length >= 10) setSubmitted(true); }}
                style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, maxWidth: 480, background: 'var(--paper)', border: '1.5px solid var(--ink)', borderRadius: 999, padding: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', color: 'var(--ink-2)', fontFamily: 'var(--mono)', fontSize: 13, borderRight: '1px solid var(--rule)' }}>
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                    placeholder="98765 43210"
                    style={{
                      flex: 1, border: 'none', outline: 'none', background: 'transparent',
                      padding: '0 16px', fontSize: 16, color: 'var(--ink)',
                      fontFamily: 'var(--mono)', letterSpacing: '0.04em',
                    }}
                  />
                  <button type="submit" className="btn btn-accent" style={{ padding: '14px 24px', fontSize: 14 }}>
                    Send setup link
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </form>
            ) : (
              <div style={{
                padding: 16, maxWidth: 480, marginBottom: 18,
                background: 'var(--accent-soft)', borderRadius: 999, color: 'var(--emerald-deep)', fontSize: 14,
                display: 'flex', gap: 12, alignItems: 'center',
                animation: 'fadeUp 400ms cubic-bezier(.2,.8,.2,1) both',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'grid', placeItems: 'center' }}>✓</div>
                <div style={{ fontWeight: 500 }}>Setup link sent to +91 {phone}. Check WhatsApp.</div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--ink-3)', marginBottom: 32 }}>
              <span>No app to install.</span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink-3)' }}/>
              <span>No card, no commitment.</span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--ink-3)' }}/>
              <span>Live in 7 minutes.</span>
            </div>

            {/* Compliance row */}
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', paddingTop: 24, borderTop: '1px solid var(--rule)' }}>
              {['ABDM Ready', 'DPDP Compliant', 'NMC Aligned', 'WhatsApp Business API'].map(c => (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                  {c}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: phone with annotations */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
            <PhoneShowcase/>

            {/* Annotation 1 — top right of phone */}
            <Annotation top={70} right={-30} side="left">
              <div className="mono" style={{ fontSize: 9, letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 4 }}>01 · INPUT</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Patient writes in Hindi.</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Auto-detected. No setup.</div>
            </Annotation>

            {/* Annotation 2 — middle left */}
            <Annotation top={260} left={-50} side="right">
              <div className="mono" style={{ fontSize: 9, letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 4 }}>02 · BRAIN</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>AI matches a protocol.</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Pediatric fever_v3.</div>
            </Annotation>

            {/* Annotation 3 — bottom right */}
            <Annotation top={500} right={-40} side="left">
              <div className="mono" style={{ fontSize: 9, letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 4 }}>03 · OUTCOME</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Booked. You weren't even online.</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Average 1.4 sec turnaround.</div>
            </Annotation>
          </div>
        </div>
      </div>
    </section>
  );
}

function Annotation({ top, left, right, side, children }) {
  // side = which side of the box the connector line comes from
  return (
    <div style={{
      position: 'absolute',
      top, left, right,
      width: 220,
      background: 'var(--paper)',
      border: '1px solid var(--rule)',
      borderRadius: 12,
      padding: '12px 14px',
      boxShadow: 'var(--shadow-md)',
      animation: 'fadeUp 600ms cubic-bezier(.2,.8,.2,1) both',
    }}>
      {/* connector */}
      <svg style={{
        position: 'absolute',
        top: 22,
        [side]: -40,
        width: 40, height: 24,
        pointerEvents: 'none',
      }} viewBox="0 0 40 24">
        <path d={side === 'left' ? 'M 0 12 L 40 12' : 'M 0 12 L 40 12'} stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 3"/>
        <circle cx={side === 'left' ? 1 : 39} cy="12" r="3" fill="var(--accent)"/>
      </svg>
      {children}
    </div>
  );
}

window.Hero = Hero;
window.HEADLINES = HEADLINES;
