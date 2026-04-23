/* global React useISTClock */
const { useState: useStateRT, useEffect: useEffectRT } = React;

// ============================================================
// REAL-TIME PAIN — clock-aware copy + live activity feed
// ============================================================

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

function RealTimePain() {
  const { time, after } = useISTClock();
  const [feed, setFeed] = useStateRT(() => FEED.slice(0, 5));
  const [missed, setMissed] = useStateRT(1284);

  useEffectRT(() => {
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
    <section id="pain" style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '120px 0', position: 'relative', overflow: 'hidden' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

          {/* LEFT: time-aware pain */}
          <div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--accent)', marginBottom: 18 }}>
              <span className="live-dot" style={{ marginRight: 8, verticalAlign: 'middle' }}/>
              IST {time} · LIVE
            </div>

            <h2 className="serif" style={{ fontSize: 'var(--fs-h1)', marginBottom: 20, color: 'var(--paper)' }}>
              {tone.kicker}<br/>
              <em className="italic" style={{ color: 'oklch(0.55 0.02 95)' }}>{tone.body}</em>
            </h2>

            <p style={{ fontSize: 17, color: 'oklch(0.78 0.01 95)', maxWidth: 480, lineHeight: 1.55, marginBottom: 32 }}>
              While you read this, doctors across India are watching messages pile up.
              Most will go unanswered until tomorrow morning. Some until never.
            </p>

            <div style={{ display: 'flex', gap: 32, paddingTop: 24, borderTop: '1px solid oklch(0.32 0.012 250)' }}>
              <div>
                <div className="serif" style={{ fontSize: 56, color: 'var(--accent)' }}>{missed.toLocaleString('en-IN')}</div>
                <div className="mono" style={{ fontSize: 11, color: 'oklch(0.65 0.01 95)', letterSpacing: '0.06em', marginTop: 4 }}>messages waiting · across India · right now</div>
              </div>
              <div>
                <div className="serif" style={{ fontSize: 56 }}>3 hrs</div>
                <div className="mono" style={{ fontSize: 11, color: 'oklch(0.65 0.01 95)', letterSpacing: '0.06em', marginTop: 4 }}>your evening · gone again</div>
              </div>
            </div>
          </div>

          {/* RIGHT: live feed */}
          <div style={{
            background: 'oklch(0.21 0.012 250)',
            border: '1px solid oklch(0.32 0.012 250)',
            borderRadius: 16,
            overflow: 'hidden',
            fontFamily: 'var(--mono)',
            fontSize: 12,
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid oklch(0.32 0.012 250)',
              display: 'flex', justifyContent: 'space-between',
              color: 'oklch(0.65 0.01 95)',
              fontSize: 10, letterSpacing: '0.12em',
            }}>
              <span>↳ INCOMING · INDIA · LAST 60 SEC · ILLUSTRATIVE</span>
              <span><span className="live-dot" style={{ marginRight: 6, verticalAlign: 'middle' }}/> LIVE</span>
            </div>
            <div>
              {feed.map((f, i) => (
                <div key={f.ts || i} style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid oklch(0.26 0.012 250)',
                  display: 'flex', gap: 14, alignItems: 'center',
                  animation: i === 0 ? 'fadeUp 400ms cubic-bezier(.2,.8,.2,1) both' : 'none',
                  opacity: 1 - (i * 0.12),
                }}>
                  <div style={{ minWidth: 80, color: 'var(--accent)', fontSize: 11 }}>{f.city}</div>
                  <div style={{ minWidth: 90, color: 'oklch(0.6 0.01 95)', fontSize: 10 }}>{f.spec}</div>
                  <div style={{ flex: 1, color: 'oklch(0.92 0.01 95)', fontFamily: 'var(--sans)', fontSize: 13 }}>"{f.msg}"</div>
                  <div style={{ fontSize: 9, color: 'oklch(0.55 0.01 95)', letterSpacing: '0.08em' }}>{f.lang.toUpperCase()}</div>
                </div>
              ))}
            </div>
            <div style={{
              padding: '10px 16px',
              background: 'oklch(0.18 0.012 250)',
              fontSize: 10, letterSpacing: '0.08em',
              color: 'oklch(0.55 0.01 95)',
            }}>
              ↑ DrCliniq is replying to {(847 + Math.floor(missed/4)).toLocaleString('en-IN')} of these in real time.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.RealTimePain = RealTimePain;
