/* global React Logo */
const { useState: useStateF2, useMemo: useMemoF2, useEffect: useEffectF2 } = React;

// ============================================================
// FOUNDERS' WALL — honest pre-launch note + early-access signups
// ============================================================
function Wall() {
  const specialties = [
    { s: 'Pediatrics',       c: 'Mumbai',     t: '2 days ago' },
    { s: 'General Practice', c: 'Hyderabad',  t: '2 days ago' },
    { s: 'Gynaecology',      c: 'Lucknow',    t: '3 days ago' },
    { s: 'Dermatology',      c: 'Bengaluru',  t: '4 days ago' },
    { s: 'Family Medicine',  c: 'Jaipur',     t: '5 days ago' },
    { s: 'ENT',              c: 'Chennai',    t: '6 days ago' },
  ];
  return (
    <section id="voices" style={{ padding: '120px 0', background: 'var(--paper-2)', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
      <div className="container">
        <div className="eyebrow" style={{ marginBottom: 18 }}>A note from the founders</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 80, alignItems: 'start' }}>
          <div>
            <h2 className="serif" style={{ fontSize: 'var(--fs-h1)', marginBottom: 32 }}>
              We haven't launched yet. <span className="italic" style={{ color: 'var(--ink-3)' }}>So we won't pretend we have.</span>
            </h2>
            <div className="serif" style={{ fontSize: 20, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <p>
                Every doctor photo, testimonial quote, and review you've probably seen on other "clinic AI" sites — we could have generated those too. We chose not to.
              </p>
              <p>
                DrCliniq is in closed beta with a small group of early-access doctors across India. The numbers you see on this page are <em>design targets</em> and <em>representative scenarios</em> — not launch-day claims.
              </p>
              <p style={{ color: 'var(--ink)' }}>
                When a real doctor is willing to put their name behind us, their words will go here. Until then, you're reading ours.
              </p>
            </div>
            <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 14 }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-3)' }}>SIGNED</div>
              <div className="serif italic" style={{ fontSize: 22, color: 'var(--ink)' }}>The DrCliniq team</div>
              <div style={{ flex: 1 }} />
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)' }}>BENGALURU · 2026</div>
            </div>
          </div>

          <div style={{ padding: 32, background: 'var(--paper)', border: '1px solid var(--rule)', borderRadius: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--accent-deep)' }}>■ EARLY ACCESS</div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)' }}>LAST 7 DAYS</div>
            </div>
            <div className="serif" style={{ fontSize: 32, color: 'var(--ink)', marginBottom: 4, lineHeight: 1.1 }}>
              Doctors who signed up
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 28, letterSpacing: '0.04em' }}>
              Names withheld during beta · specialty + city shown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {specialties.map((d, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', alignItems: 'center', padding: '16px 0', borderTop: i === 0 ? '1px solid var(--rule)' : 'none', borderBottom: '1px solid var(--rule)', gap: 12 }}>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{String(i + 1).padStart(2, '0')}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>Dr. ▇▇▇▇▇▇▇</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, letterSpacing: '0.04em' }}>{d.s.toUpperCase()} · {d.c.toUpperCase()}</div>
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>{d.t}</div>
                </div>
              ))}
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 20, letterSpacing: '0.06em', lineHeight: 1.6 }}>
              * Illustrative roster for representation. Actual beta list is under NDA until public launch.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// PRICING RECOMMENDER — pick volume, get tier
// ============================================================
function Pricing() {
  const [vol, setVol] = useStateF2(40);
  const tier = vol < 15 ? 0 : vol < 60 ? 1 : 2;

  const tiers = [
    { name: 'Free', price: 0, suffix: 'forever', tag: 'Solo doctors testing the waters', features: ['3 protocols', '50 messages/day', 'Hindi + English', 'Basic inbox', 'Email support'], cta: 'Start free' },
    { name: 'Pro', price: 499, suffix: '/month', tag: 'Clinics that want full control', features: ['Unlimited protocols', 'Unlimited messages', 'Custom keywords', 'Image + doc support', 'Prescription auto-send', 'Day 3/7 follow-ups', 'Priority support'], cta: 'Get Pro' },
    { name: 'Clinic+', price: 999, suffix: '/month', tag: 'AI-powered clinic automation', features: ['Everything in Pro', 'AI triage + voice notes', 'Lab report parsing', 'Morning briefing', 'Analytics + benchmarks', 'Up to 5 team accounts', 'Dedicated success manager'], cta: 'Get Clinic+' },
  ];

  return (
    <section id="pricing" style={{ padding: '120px 0' }}>
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 32px' }}>
          <div className="eyebrow" style={{ marginBottom: 18, justifyContent: 'center' }}>Pricing</div>
          <h2 className="serif" style={{ fontSize: 'var(--fs-h1)', marginBottom: 14 }}>
            Less than your daily{' '}
            <em className="italic" style={{ color: 'var(--accent)' }}>chai budget.</em>
          </h2>
          <p style={{ fontSize: 17, color: 'var(--ink-2)' }}>
            Tell us your volume. We'll point at the right tier — no hard sell.
          </p>
        </div>

        {/* Volume slider */}
        <div style={{ maxWidth: 600, margin: '0 auto 56px', padding: 24, background: 'var(--paper-2)', border: '1px solid var(--rule)', borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Patients you see per day</span>
            <span className="serif" style={{ fontSize: 32 }}>{vol}{vol === 150 ? '+' : ''}</span>
          </div>
          <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', inset: '11px 0 11px', background: 'var(--rule)' }}/>
            <div style={{ position: 'absolute', left: 0, width: `${(vol/150)*100}%`, height: 2, background: 'var(--accent)' }}/>
            <input type="range" min="5" max="150" value={vol} onChange={(e) => setVol(Number(e.target.value))}
              style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', cursor: 'grab' }}/>
            <div style={{ position: 'absolute', left: `calc(${(vol/150)*100}% - 9px)`, width: 18, height: 18, borderRadius: '50%', background: 'var(--paper)', border: '2px solid var(--ink)', pointerEvents: 'none' }}/>
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 16, textAlign: 'center', letterSpacing: '0.04em' }}>
            ↳ recommended: <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{tiers[tier].name}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'stretch' }}>
          {tiers.map((t, i) => {
            const recommended = i === tier;
            return (
              <div key={t.name} style={{
                padding: 32,
                border: recommended ? '1.5px solid var(--accent)' : '1px solid var(--rule)',
                borderRadius: 18,
                background: recommended ? 'var(--paper)' : 'var(--paper)',
                position: 'relative',
                display: 'flex', flexDirection: 'column', gap: 20,
                transform: recommended ? 'translateY(-12px)' : 'none',
                boxShadow: recommended ? 'var(--shadow-lg)' : 'none',
                transition: 'all 250ms',
              }}>
                {recommended && (
                  <div style={{ position: 'absolute', top: -12, left: 32, background: 'var(--accent)', color: 'white', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase' }}>
                    Recommended for you
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t.tag}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, paddingBottom: 8, borderBottom: '1px solid var(--rule)' }}>
                  <span className="serif" style={{ fontSize: 56 }}>₹{t.price}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t.suffix}</span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, padding: 0, fontSize: 13.5, flex: 1 }}>
                  {t.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ marginTop: 3, flexShrink: 0 }}><path d="M20 6L9 17l-5-5"/></svg>
                      <span style={{ color: 'var(--ink-2)' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button className={recommended ? 'btn btn-accent' : 'btn btn-ghost'} style={{ justifyContent: 'center', padding: '14px 20px', fontSize: 14 }}>
                  {t.cta} →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FINAL CTA + FOOTER
// ============================================================
function FinalCTA() {
  const [phone, setPhone] = useStateF2('');
  const [done, setDone] = useStateF2(false);
  return (
    <section id="signup" style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '140px 0', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(var(--paper) 1px, transparent 1px), linear-gradient(90deg, var(--paper) 1px, transparent 1px)', backgroundSize: '60px 60px' }}/>
      <div className="container" style={{ position: 'relative', textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
        <div className="eyebrow" style={{ color: 'oklch(0.7 0.02 95)', justifyContent: 'center', marginBottom: 18 }}>
          <span className="live-dot"/> One last thing
        </div>
        <h2 className="serif" style={{ fontSize: 'var(--fs-h1)', marginBottom: 24, lineHeight: 1.05 }}>
          You won't redesign WhatsApp.<br/>
          <em className="italic" style={{ color: 'var(--accent)' }}>You can teach it medicine.</em>
        </h2>
        <p style={{ fontSize: 17, color: 'oklch(0.75 0.01 95)', maxWidth: 540, margin: '0 auto 40px' }}>
          One number. Ten digits. We'll WhatsApp you a setup link in under 30 seconds.
        </p>

        {!done ? (
          <form onSubmit={(e) => { e.preventDefault(); if (phone.length >= 10) setDone(true); }} style={{
            display: 'flex', maxWidth: 480, margin: '0 auto',
            background: 'oklch(0.22 0.012 250)', borderRadius: 999, padding: 5,
            border: '1px solid oklch(0.32 0.012 250)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', color: 'oklch(0.7 0.02 95)', fontFamily: 'var(--mono)', fontSize: 13, borderRight: '1px solid oklch(0.32 0.012 250)' }}>
              🇮🇳 +91
            </div>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
              placeholder="98765 43210"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '14px', fontSize: 15, color: 'var(--paper)', fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}/>
            <button type="submit" className="btn btn-accent" style={{ padding: '12px 22px' }}>Send setup link</button>
          </form>
        ) : (
          <div style={{
            background: 'var(--accent-soft)', color: 'var(--emerald-deep)',
            padding: 16, borderRadius: 16, maxWidth: 460, margin: '0 auto',
            display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left',
            animation: 'fadeUp 400ms cubic-bezier(.2,.8,.2,1) both',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'grid', placeItems: 'center', flexShrink: 0 }}>✓</div>
            <div>
              <div style={{ fontWeight: 500 }}>Setup link sent to +91 {phone}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Check WhatsApp in ~30 seconds.</div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 12, color: 'oklch(0.6 0.02 95)' }}>
          No credit card required. Free plan available forever.
        </div>

        <div style={{ display: 'flex', gap: 56, marginTop: 64, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ n: 'Beta', l: 'currently in closed beta' }, { n: 'Target', l: '10k clinics by 2027' }, { n: '<2s', l: 'AI reply target' }, { n: 'Made', l: 'for Indian practice' }].map(s => (
            <div key={s.l}>
              <div className="serif" style={{ fontSize: 40 }}>{s.n}</div>
              <div className="mono" style={{ fontSize: 11, color: 'oklch(0.6 0.02 95)', letterSpacing: '0.06em', marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'oklch(0.55 0.02 95)', letterSpacing: '0.08em', marginTop: 28, textAlign: 'center', opacity: 0.8 }}>
          ★ NUMBERS SHOWN ACROSS THIS PAGE ARE ILLUSTRATIVE / REPRESENTATIVE UNTIL PUBLIC LAUNCH ★
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--rule)', padding: '56px 0 32px', background: 'var(--paper)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
          <div>
            <Logo/>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 16, maxWidth: 280, lineHeight: 1.5 }}>
              An operating system for solo Indian clinics. Not a chatbot. A clinical assistant that lives in WhatsApp.
            </p>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 24, letterSpacing: '0.04em' }}>
              Made with ♡ in Bengaluru, for doctors across India.
            </div>
          </div>
          {[
            { h: 'Product', l: ['Live demo', 'Theatre', 'Library', 'Pricing', 'Changelog'] },
            { h: 'Company', l: ['About', 'Blog', 'Careers', 'Press', 'Contact'] },
            { h: 'Legal', l: ['Privacy', 'Terms', 'DPDP', 'ABDM', 'Security'] },
            { h: 'Connect', l: ['WhatsApp', 'Twitter / X', 'LinkedIn', 'Email', 'Status'] },
          ].map(g => (
            <div key={g.h}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 16 }}>{g.h}</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, padding: 0, fontSize: 13 }}>
                {g.l.map(i => <li key={i}><a className="u-link" style={{ color: 'var(--ink-2)' }}>{i}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1px solid var(--rule)', fontSize: 12, color: 'var(--ink-3)', flexWrap: 'wrap', gap: 16 }}>
          <div>© 2026 DrCliniq Technologies Pvt Ltd.</div>
          <div className="mono" style={{ letterSpacing: '0.04em' }}>v3.0 · Apr 2026</div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// STICKY FUNNEL — always-visible mini CTA after hero scrolls
// ============================================================
function StickyFunnel() {
  const [visible, setVisible] = useStateF2(false);
  const [phone, setPhone] = useStateF2('');
  useEffectF2(() => {
    const onScroll = () => setVisible(window.scrollY > 800);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 40, background: 'var(--ink)', color: 'var(--paper)',
      borderRadius: 999, padding: 5, paddingLeft: 18,
      boxShadow: '0 20px 50px -20px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', gap: 12,
      animation: 'fadeUp 400ms cubic-bezier(.2,.8,.2,1) both',
      maxWidth: 'calc(100vw - 32px)',
    }}>
      <span className="live-dot"/>
      <span style={{ fontSize: 13, color: 'oklch(0.85 0.01 95)' }}>Get DrCliniq on your number</span>
      <form onSubmit={(e) => { e.preventDefault(); if (phone.length >= 10) document.getElementById('signup')?.scrollIntoView({behavior:'smooth'}); }}
        style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
          placeholder="98765 43210"
          style={{ background: 'oklch(0.22 0.012 250)', border: 'none', borderRadius: 999, padding: '8px 14px', color: 'var(--paper)', fontFamily: 'var(--mono)', fontSize: 13, width: 140, outline: 'none' }}/>
        <button type="submit" className="btn btn-accent" style={{ padding: '8px 14px', fontSize: 13 }}>Start →</button>
      </form>
    </div>
  );
}

window.Wall = Wall;
window.Pricing = Pricing;
window.FinalCTA = FinalCTA;
window.Footer = Footer;
window.StickyFunnel = StickyFunnel;
