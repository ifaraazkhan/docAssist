/* global React */
const { useState: useStateD, useEffect: useEffectD, useRef: useRefD } = React;

// ============================================================
// HERO — phone-only, editorial composition with annotation callouts
// ============================================================

const SCRIPT = [
  { from: 'p', t: 700, text: 'Doctor sahab, mere bete ko subah se 102 fever hai 🥲', meta: 'detected: hi-IN' },
  { from: 'a-think', t: 600, text: 'classifying · age · risk · protocol' },
  { from: 'a', t: 800, text: 'Namaste! Bachhe ki age batayein? Kab se fever hai?', tag: 'pediatric_fever_v3' },
  { from: 'p', t: 1000, text: '4 saal. Subah 6 baje se. Halki cough bhi hai.' },
  { from: 'a-think', t: 500, text: 'triage → MEDIUM · slot found' },
  { from: 'a', t: 1000, text: '4 saal ke liye:\n• Paracetamol 250mg syrup, 5ml every 6hr\n• ORS hourly sips\n• Sponge if temp > 102°F\n\nDr Mehta has 4:30 PM open. Confirm?' },
  { from: 'p', t: 900, text: 'Confirm 🙏' },
  { from: 'sys', t: 600, text: 'Booked · Today 4:30 PM · Reminder set' },
];

function useScript(loop = true) {
  const [step, setStep] = useStateD(0);
  const [k, setK] = useStateD(0);
  useEffectD(() => {
    if (step >= SCRIPT.length) {
      const t = setTimeout(() => { setStep(0); setK(x => x + 1); }, loop ? 3000 : 999999);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep(s => s + 1), SCRIPT[step].t);
    return () => clearTimeout(t);
  }, [step]);
  return { step, k };
}

function PhoneShowcase() {
  const { step, k } = useScript();
  const ref = useRefD(null);
  useEffectD(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [step, k]);

  return (
    <div style={{
      width: 340,
      background: '#0d0d0d',
      borderRadius: 44,
      padding: 10,
      boxShadow: '0 60px 120px -50px rgba(20,30,40,0.4), 0 30px 60px -30px rgba(20,30,40,0.25)',
      position: 'relative',
    }}>
      {/* notch */}
      <div style={{
        position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
        width: 100, height: 26, background: '#0d0d0d', borderRadius: 14, zIndex: 5,
      }}/>
      <div style={{
        background: '#e5ddd5',
        borderRadius: 36,
        height: 640,
        overflow: 'hidden',
        position: 'relative',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cpath d=\'M30 30 L40 40 M60 60 L70 70 M20 70 L30 60\' stroke=\'%23d4ccc4\' stroke-width=\'1\' opacity=\'0.4\'/%3E%3C/svg%3E")',
      }}>
        {/* WhatsApp header */}
        <div style={{
          background: '#075e54', color: 'white',
          padding: '50px 16px 12px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 18 }}>‹</span>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: '#dcf8c6', color: '#075e54',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--serif)', fontWeight: 600, fontSize: 16,
          }}>P</div>
          <div style={{ flex: 1, lineHeight: 1.2 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Priya Sharma</div>
            <div style={{ fontSize: 11, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }}/> typing…
            </div>
          </div>
          <span style={{ fontSize: 16, opacity: 0.8 }}>📞</span>
          <span style={{ fontSize: 16, opacity: 0.8 }}>⋮</span>
        </div>

        {/* Date pill */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{
            background: '#e1f3fb', color: '#54656f', padding: '4px 10px',
            borderRadius: 10, fontSize: 11,
          }}>Today</div>
        </div>

        {/* Messages */}
        <div ref={ref} style={{
          padding: '6px 12px 80px',
          display: 'flex', flexDirection: 'column', gap: 4,
          height: 'calc(100% - 154px)',
          overflowY: 'auto', scrollBehavior: 'smooth',
        }}>
          {SCRIPT.slice(0, step).map((m, i) => <Msg key={`${k}-${i}`} m={m}/>)}
          {step > 0 && step < SCRIPT.length && SCRIPT[step].from.startsWith('a') && (
            <div style={{
              alignSelf: 'flex-start', background: 'white',
              padding: '10px 14px', borderRadius: 10,
              display: 'flex', gap: 4,
            }}>
              <Dot d={0}/><Dot d={150}/><Dot d={300}/>
            </div>
          )}
        </div>

        {/* input */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: 10, background: '#f0f0f0',
          display: 'flex', gap: 8,
        }}>
          <div style={{
            flex: 1, background: 'white', borderRadius: 22,
            padding: '8px 14px', fontSize: 12, color: '#aaa',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>Message</span>
            <span>📎</span>
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: '#075e54', display: 'grid', placeItems: 'center',
            color: 'white', fontSize: 16,
          }}>🎤</div>
        </div>
      </div>
    </div>
  );
}

function Msg({ m }) {
  if (m.from === 'a-think') {
    return (
      <div style={{
        alignSelf: 'center',
        fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.06em',
        color: '#888', background: 'rgba(255,255,255,0.5)',
        border: '1px dashed rgba(0,0,0,0.18)', borderRadius: 6,
        padding: '4px 10px', margin: '4px 0',
        animation: 'fadeUp 320ms cubic-bezier(.2,.8,.2,1) both',
      }}>⚙ {m.text}</div>
    );
  }
  if (m.from === 'sys') {
    return (
      <div style={{
        alignSelf: 'center', fontSize: 11,
        background: '#dcf8c6', color: '#075e54',
        borderRadius: 999, padding: '6px 14px', margin: '8px 0',
        animation: 'fadeUp 320ms cubic-bezier(.2,.8,.2,1) both',
        fontWeight: 500,
      }}>✓ {m.text}</div>
    );
  }
  const isP = m.from === 'p';
  return (
    <div style={{
      alignSelf: isP ? 'flex-end' : 'flex-start', maxWidth: '82%',
      animation: 'fadeUp 360ms cubic-bezier(.2,.8,.2,1) both',
    }}>
      <div style={{
        background: isP ? '#dcf8c6' : 'white',
        color: '#111',
        padding: '8px 11px 7px',
        borderRadius: 8,
        boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
        fontSize: 13, lineHeight: 1.45,
        whiteSpace: 'pre-wrap',
      }}>
        {m.tag && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--accent-deep)', marginBottom: 4, textTransform: 'lowercase' }}>{m.tag}</div>
        )}
        {m.text}
        <div style={{ fontSize: 9, color: '#888', marginTop: 3, textAlign: 'right' }}>9:47 {isP ? '' : '✓✓'}</div>
      </div>
      {m.meta && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(0,0,0,0.4)', marginTop: 3, textAlign: isP ? 'right' : 'left' }}>
          {m.meta}
        </div>
      )}
    </div>
  );
}

function Dot({ d }) {
  return <span style={{
    width: 5, height: 5, borderRadius: '50%', background: '#999',
    animation: `bounce 1s ${d}ms infinite`,
  }}/>;
}

window.PhoneShowcase = PhoneShowcase;
window.useScript = useScript;
window.SCRIPT = SCRIPT;
