/* global React */
const { useState: useStateL, useMemo: useMemoL } = React;

// ============================================================
// PROTOCOL LIBRARY — interactive, filterable
// ============================================================

const PROTOCOLS = [
  { name: 'Pediatric fever', spec: 'Pediatrics', uses: 12482, lang: ['hi','en'], preview: 'Bachhe ki age + temp puchta hai. Paracetamol dose by weight. Red flags flag.' },
  { name: 'Adult fever', spec: 'GP', uses: 8204, lang: ['hi','en'], preview: 'Onset, severity, associated symptoms. Triages dengue/malaria risk.' },
  { name: 'Cold & cough', spec: 'GP', uses: 11209, lang: ['hi','en'], preview: 'Symptomatic protocol with red flags for asthma + LRTI.' },
  { name: 'Diabetes follow-up', spec: 'Endocrine', uses: 4392, lang: ['en'], preview: 'HbA1c, fasting, post-prandial trend. Flags pre-diabetic.' },
  { name: 'BP review', spec: 'Cardiology', uses: 3102, lang: ['hi','en'], preview: 'Reading collection, hypertensive urgency triage.' },
  { name: 'Pregnancy queries', spec: 'Gyn', uses: 6841, lang: ['hi','en'], preview: 'Trimester-aware. Schedules ANC visits. Flags bleeding.' },
  { name: 'Skin rash', spec: 'Derma', uses: 2914, lang: ['hi','en'], preview: 'Photo-aware. Differential dermatitis vs allergy vs infection.' },
  { name: 'Clinic timings', spec: 'Universal', uses: 28412, lang: ['hi','en'], preview: 'Shift-aware. Updates on Sundays + holidays automatically.' },
  { name: 'Prescription refill', spec: 'Universal', uses: 9182, lang: ['hi','en'], preview: 'Verifies last visit, sends if within window, flags otherwise.' },
  { name: 'Lab report intake', spec: 'GP', uses: 5621, lang: ['hi','en'], preview: 'Parses CBC, lipid, sugar PDFs. Flags abnormal.' },
  { name: 'Post-op f/u', spec: 'Surgery', uses: 1842, lang: ['en'], preview: 'Day 1 / 3 / 7 check-ins. Photo intake for wound.' },
  { name: 'Monsoon prep', spec: 'GP', uses: 2841, lang: ['hi','en'], preview: 'Activates dengue/malaria/leptospirosis triage automatically.' },
];

const SPECS = ['All', 'GP', 'Pediatrics', 'Cardiology', 'Endocrine', 'Gyn', 'Derma', 'Surgery', 'Universal'];

function Library() {
  const [spec, setSpec] = useStateL('All');
  const [q, setQ] = useStateL('');
  const [active, setActive] = useStateL(0);

  const filtered = useMemoL(() => PROTOCOLS.filter(p =>
    (spec === 'All' || p.spec === spec) &&
    (q === '' || p.name.toLowerCase().includes(q.toLowerCase()))
  ), [spec, q]);

  const sel = filtered[active] || filtered[0];

  return (
    <section id="library" style={{ padding: '120px 0' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 24 }}>
          <div style={{ maxWidth: 640 }}>
            <div className="eyebrow" style={{ marginBottom: 18 }}>The Library</div>
            <h2 className="serif" style={{ fontSize: 'var(--fs-h1)' }}>
              50+ protocols.{' '}
              <em className="italic" style={{ color: 'var(--ink-3)' }}>Edit any of them in plain English.</em>
            </h2>
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search protocols…"
            style={{
              padding: '12px 18px', borderRadius: 999, border: '1px solid var(--rule)',
              background: 'var(--paper)', fontSize: 14, color: 'var(--ink)',
              fontFamily: 'var(--sans)', minWidth: 260,
            }}/>
        </div>

        {/* Spec filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--rule)' }}>
          {SPECS.map(s => (
            <button key={s} onClick={() => { setSpec(s); setActive(0); }}
              style={{
                padding: '8px 14px', borderRadius: 999,
                background: spec === s ? 'var(--ink)' : 'transparent',
                color: spec === s ? 'var(--paper)' : 'var(--ink-2)',
                border: '1px solid ' + (spec === s ? 'var(--ink)' : 'var(--rule)'),
                fontSize: 13, transition: 'all 150ms',
              }}>{s}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--rule)', border: '1px solid var(--rule)', borderRadius: 12, overflow: 'hidden' }}>
            {filtered.map((p, i) => (
              <button key={p.name} onClick={() => setActive(i)} style={{
                background: active === i ? 'var(--paper-2)' : 'var(--paper)',
                padding: '18px 20px',
                display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16,
                alignItems: 'center', textAlign: 'left',
                borderLeft: active === i ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'background 150ms',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{p.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>{p.spec.toUpperCase()} · {p.lang.map(l => l.toUpperCase()).join(' / ')}</div>
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.uses.toLocaleString('en-IN')} uses</div>
                <span style={{ color: 'var(--ink-3)', fontSize: 16 }}>›</span>
              </button>
            ))}
          </div>

          {/* Preview */}
          {sel && (
            <div style={{ position: 'sticky', top: 90, height: 'fit-content' }}>
              <div style={{
                background: 'var(--paper-2)', borderRadius: 16, padding: 28,
                border: '1px solid var(--rule)',
              }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 8 }}>PROTOCOL · {sel.spec.toUpperCase()}</div>
                <h3 className="serif" style={{ fontSize: 30, marginBottom: 12 }}>{sel.name}</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 24 }}>{sel.preview}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  <Stat k="Used by" v={`${Math.round(sel.uses/100)} clinics`}/>
                  <Stat k="Languages" v={sel.lang.join(' + ').toUpperCase()}/>
                  <Stat k="Avg reply" v="1.2s"/>
                  <Stat k="Patient sat" v="94%"/>
                </div>

                <div style={{ background: 'var(--paper)', borderRadius: 10, padding: 18, border: '1px solid var(--rule)' }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--accent-deep)', marginBottom: 12, textTransform: 'uppercase' }}>Protocol reply · write it in plain words</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink)', fontFamily: 'var(--sans)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Fever & Cold</div>
                    <div style={{ color: 'var(--ink-2)' }}>
                      For fever: Rest well, stay hydrated. Take Paracetamol 500mg if temp &gt; 99°F. Visit clinic if no relief in 48 hours or temp &gt; 103°F.
                    </div>
                    <div style={{ height: 1, background: 'var(--rule)', margin: '14px 0' }}/>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>बुखार और सर्दी</div>
                    <div style={{ color: 'var(--ink-2)' }}>
                      बुखार में: आराम करें, पानी पीते रहें। 99°F से ऊपर हो तो Paracetamol 500mg लें। 48 घंटे में आराम न हो या 103°F से ऊपर जाए तो क्लिनिक आएं।
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 14, letterSpacing: '0.06em' }}>
                    ↳ No code. No if-else. Just how you'd tell the patient yourself.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ k, v }) {
  return (
    <div style={{ background: 'var(--paper)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--rule)' }}>
      <div className="mono" style={{ fontSize: 9, letterSpacing: '0.08em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 3 }}>{k}</div>
      <div className="serif" style={{ fontSize: 18 }}>{v}</div>
    </div>
  );
}

window.Library = Library;
