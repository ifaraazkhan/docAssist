/* global React */
const { useState: useStateC, useMemo: useMemoC } = React;

// ============================================================
// ROI CALCULATOR — interactive, lives in funnel as the "math moment"
// ============================================================

function Calculator() {
  const [patients, setPatients] = useStateC(40);
  const [whatsappPct, setWhatsappPct] = useStateC(60);
  const [hourly, setHourly] = useStateC(2000);

  const numbers = useMemoC(() => {
    const msgsPerDay = Math.round(patients * whatsappPct / 100 * 4);
    const minsPerMsg = 1.5;
    const minsSavedPerDay = Math.round(msgsPerDay * minsPerMsg * 0.85);
    const hoursPerMonth = Math.round(minsSavedPerDay * 26 / 60);
    const moneyPerMonth = Math.round(hoursPerMonth * hourly);
    const noShowSaved = Math.round(patients * 26 * 0.38 * 0.18 * (hourly * 0.7));
    const total = moneyPerMonth + noShowSaved;
    return { msgsPerDay, minsSavedPerDay, hoursPerMonth, moneyPerMonth, noShowSaved, total };
  }, [patients, whatsappPct, hourly]);

  return (
    <section id="math" style={{ padding: '120px 0', position: 'relative' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 64, alignItems: 'start' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 18 }}>Do the math</div>
            <h2 className="serif" style={{ fontSize: 'var(--fs-h1)', marginBottom: 20 }}>
              How much is{' '}
              <em className="italic" style={{ color: 'var(--accent)' }}>your</em>{' '}
              WhatsApp costing you?
            </h2>
            <p style={{ fontSize: 17, color: 'var(--ink-2)', maxWidth: 480, lineHeight: 1.55, marginBottom: 32 }}>
              Three sliders. No email gate. We won't pretend the savings are universal — yours depend on patient volume, what they message about, and what your time is worth.
            </p>

            <Slider label="Patients per day" value={patients} min={5} max={150} step={1} onChange={setPatients} unit="patients" />
            <Slider label="What % message you on WhatsApp" value={whatsappPct} min={10} max={100} step={5} onChange={setWhatsappPct} unit="%" />
            <Slider label="Your hourly time worth" value={hourly} min={500} max={8000} step={100} onChange={setHourly} unit="₹/hr" />

            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 24, letterSpacing: '0.04em', maxWidth: 380 }}>
              ≈ {numbers.msgsPerDay} messages/day · {numbers.minsSavedPerDay} mins reclaimed daily · {numbers.hoursPerMonth} hrs/month
            </div>
          </div>

          {/* Result panel */}
          <div style={{
            background: 'var(--ink)', color: 'var(--paper)',
            borderRadius: 18, padding: 40,
            position: 'sticky', top: 90,
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: 'oklch(0.65 0.01 95)', marginBottom: 12 }}>
              ESTIMATED RECOVERY · MONTHLY
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24 }}>
              <span className="serif" style={{ fontSize: 96, color: 'var(--accent)', lineHeight: 1 }}>
                ₹{Math.round(numbers.total / 1000)}k
              </span>
              <span className="mono" style={{ fontSize: 12, color: 'oklch(0.7 0.01 95)' }}>/ month</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: '1px solid oklch(0.32 0.012 250)' }}>
              <Row k="Time reclaimed" v={`${numbers.hoursPerMonth} hrs/mo`} sub={`= ₹${numbers.moneyPerMonth.toLocaleString('en-IN')}`}/>
              <Row k="No-shows recovered" v="38% reduction" sub={`= ₹${numbers.noShowSaved.toLocaleString('en-IN')}`}/>
              <Row k="DrCliniq cost" v="₹999 / mo" sub="Clinic+ tier" highlight/>
            </div>

            <div style={{ marginTop: 24, padding: 16, background: 'oklch(0.21 0.012 250)', borderRadius: 10, fontSize: 13, color: 'oklch(0.85 0.01 95)' }}>
              <span style={{ color: 'var(--accent)' }}>↳</span> You'd net <strong>₹{(numbers.total - 999).toLocaleString('en-IN')}/month</strong> by Friday.
            </div>

            <div className="mono" style={{ fontSize: 10, color: 'oklch(0.6 0.01 95)', letterSpacing: '0.06em', marginTop: 12, lineHeight: 1.5 }}>
              ★ Estimates based on doctor-provided inputs. Representational only; real results vary.
            </div>

            <button className="btn btn-accent" style={{ marginTop: 20, width: '100%', justifyContent: 'center', padding: '14px' }}>
              Start clawing it back →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Slider({ label, value, min, max, step, onChange, unit }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{label}</span>
        <span className="serif" style={{ fontSize: 28, color: 'var(--ink)' }}>
          {unit === '₹/hr' ? `₹${value.toLocaleString('en-IN')}` : value}{unit !== '₹/hr' && <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 4 }}>{unit}</span>}
        </span>
      </div>
      <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'var(--rule)' }}/>
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 2, background: 'var(--ink)' }}/>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: 'absolute', left: 0, right: 0, width: '100%',
            opacity: 0, cursor: 'grab', height: 28, margin: 0,
          }}
        />
        <div style={{
          position: 'absolute', left: `calc(${pct}% - 9px)`,
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--paper)', border: '2px solid var(--ink)',
          pointerEvents: 'none',
        }}/>
      </div>
    </div>
  );
}

function Row({ k, v, sub, highlight }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center',
      padding: '14px 0',
      borderBottom: '1px solid oklch(0.32 0.012 250)',
      color: highlight ? 'var(--accent)' : 'var(--paper)',
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{k}</div>
        <div className="mono" style={{ fontSize: 11, color: 'oklch(0.65 0.01 95)', letterSpacing: '0.04em', marginTop: 2 }}>{sub}</div>
      </div>
      <div className="serif" style={{ fontSize: 22 }}>{v}</div>
    </div>
  );
}

window.Calculator = Calculator;
