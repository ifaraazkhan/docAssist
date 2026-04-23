'use client';

import { useState, useMemo } from 'react';

const PROTOCOLS = [
  { name: 'Pediatric fever', spec: 'Pediatrics', uses: 12482, lang: ['hi', 'en'], preview: 'Bachhe ki age + temp puchta hai. Paracetamol dose by weight. Red flags flag.', replyEn: 'What is the child\'s age and current temperature? If temp > 100°F, give Paracetamol syrup (15mg/kg). Rush to hospital if child is drowsy or has rash.', replyHi: 'बच्चे की उम्र और तापमान बताएं। 100°F से ऊपर हो तो Paracetamol syrup (15mg/kg) दें। बच्चा सुस्त हो या रैश दिखे तो तुरंत हॉस्पिटल जाएं।' },
  { name: 'Adult fever', spec: 'GP', uses: 8204, lang: ['hi', 'en'], preview: 'Onset, severity, associated symptoms. Triages dengue/malaria risk.', replyEn: 'Since when do you have fever? Take Paracetamol 500mg every 6 hours. Drink plenty of fluids. If fever persists 3+ days or body pain is severe, visit clinic.', replyHi: 'बुखार कब से है? Paracetamol 500mg हर 6 घंटे लें। पानी खूब पिएं। 3 दिन से ज़्यादा बुखार रहे या बदन दर्द ज़्यादा हो तो क्लिनिक आएं।' },
  { name: 'Cold & cough', spec: 'GP', uses: 11209, lang: ['hi', 'en'], preview: 'Symptomatic protocol with red flags for asthma + LRTI.', replyEn: 'Rest well, stay hydrated. Take Cetirizine 10mg at night. Steam inhalation 2x daily. If cough has blood or breathing difficulty, visit clinic immediately.', replyHi: 'आराम करें, पानी पिएं। रात को Cetirizine 10mg लें। दिन में 2 बार भाप लें। खांसी में खून आए या सांस फूले तो तुरंत क्लिनिक आएं।' },
  { name: 'Diabetes follow-up', spec: 'Endocrine', uses: 4392, lang: ['en'], preview: 'HbA1c, fasting, post-prandial trend. Flags pre-diabetic.', replyEn: 'Please share your latest fasting and post-meal sugar readings. Continue current medication. If fasting > 130 or post-meal > 200, we need to adjust your dose.', replyHi: 'अपनी ताज़ा fasting और खाने के बाद की शुगर रीडिंग भेजें। दवाई जारी रखें। Fasting 130 या post-meal 200 से ऊपर हो तो दवाई बदलनी होगी।' },
  { name: 'BP review', spec: 'Cardiology', uses: 3102, lang: ['hi', 'en'], preview: 'Reading collection, hypertensive urgency triage.', replyEn: 'Please send your morning and evening BP readings. Continue medicines as prescribed. If BP > 180/110 with headache or chest pain, go to ER immediately.', replyHi: 'सुबह और शाम की BP रीडिंग भेजें। दवाई जारी रखें। BP 180/110 से ऊपर हो और सिरदर्द या सीने में दर्द हो तो तुरंत इमरजेंसी जाएं।' },
  { name: 'Pregnancy queries', spec: 'Gyn', uses: 6841, lang: ['hi', 'en'], preview: 'Trimester-aware. Schedules ANC visits. Flags bleeding.', replyEn: 'How many weeks pregnant are you? Take Folic acid daily. Your next ANC visit is due. If you have bleeding, severe pain or dizziness, visit hospital immediately.', replyHi: 'कितने हफ्ते की pregnancy है? Folic acid रोज़ लें। आपकी अगली ANC विज़िट बाकी है। ब्लीडिंग, तेज़ दर्द या चक्कर आए तो तुरंत हॉस्पिटल जाएं।' },
  { name: 'Skin rash', spec: 'Derma', uses: 2914, lang: ['hi', 'en'], preview: 'Photo-aware. Differential dermatitis vs allergy vs infection.', replyEn: 'Please send a clear photo of the rash. Since when do you have it? Avoid new soaps or detergents. Take Cetirizine 10mg at night. If it spreads or has pus, visit clinic.', replyHi: 'रैश की साफ फोटो भेजें। कब से है? नया साबुन या डिटर्जेंट बंद करें। रात को Cetirizine 10mg लें। फैल रहा हो या पस आए तो क्लिनिक आएं।' },
  { name: 'Clinic timings', spec: 'Universal', uses: 28412, lang: ['hi', 'en'], preview: 'Shift-aware. Updates on Sundays + holidays automatically.', replyEn: 'Sharma Clinic is open Mon–Sat, 9 AM to 1 PM and 5 PM to 8 PM. Closed on Sundays. For emergencies, call the clinic number directly.', replyHi: 'शर्मा क्लिनिक सोम–शनि खुला है, सुबह 9 से 1 बजे और शाम 5 से 8 बजे। रविवार बंद। इमरजेंसी में क्लिनिक नंबर पर कॉल करें।' },
  { name: 'Prescription refill', spec: 'Universal', uses: 9182, lang: ['hi', 'en'], preview: 'Verifies last visit, sends if within window, flags otherwise.', replyEn: 'Your last visit was 12 days ago. Same medicines have been sent to your WhatsApp. If symptoms have changed, please visit for a check-up before refilling.', replyHi: 'आपकी पिछली विज़िट 12 दिन पहले थी। वही दवाइयां आपके WhatsApp पर भेज दी हैं। लक्षण बदले हों तो रिफिल से पहले एक बार चेकअप करा लें।' },
  { name: 'Lab report intake', spec: 'GP', uses: 5621, lang: ['hi', 'en'], preview: 'Parses CBC, lipid, sugar PDFs. Flags abnormal.', replyEn: 'Reports received. Your HbA1c and LDL are slightly above normal. Doctor will review and call you tomorrow morning. No immediate concern.', replyHi: 'रिपोर्ट मिल गई। HbA1c और LDL थोड़ा ऊपर है। डॉक्टर कल सुबह रिव्यू करके कॉल करेंगे। अभी घबराने की ज़रूरत नहीं।' },
  { name: 'Post-op f/u', spec: 'Surgery', uses: 1842, lang: ['en'], preview: 'Day 1 / 3 / 7 check-ins. Photo intake for wound.', replyEn: 'How is the wound today? Please send a photo. Any redness, swelling, or discharge? Continue antibiotics as prescribed. Next follow-up in 3 days.', replyHi: 'आज ज़ख्म कैसा है? फोटो भेजें। लाली, सूजन या रिसाव तो नहीं? Antibiotics जारी रखें। अगला फॉलो-अप 3 दिन बाद।' },
  { name: 'Monsoon prep', spec: 'GP', uses: 2841, lang: ['hi', 'en'], preview: 'Activates dengue/malaria/leptospirosis triage automatically.', replyEn: 'Monsoon season alert: If you have fever with body ache, get a dengue/malaria test done. Avoid stagnant water near home. Use mosquito repellent at dusk.', replyHi: 'मॉनसून अलर्ट: बुखार के साथ बदन दर्द हो तो डेंगू/मलेरिया टेस्ट कराएं। घर के पास पानी जमा न होने दें। शाम को मच्छर भगाने वाली क्रीम लगाएं।' },
];

const SPECS = ['All', 'GP', 'Pediatrics', 'Cardiology', 'Endocrine', 'Gyn', 'Derma', 'Surgery', 'Universal'];

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg" style={{ background: 'var(--paper)', padding: '10px 12px', border: '1px solid var(--rule)' }}>
      <div className="mono uppercase" style={{ fontSize: 9, letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 3 }}>{k}</div>
      <div className="serif text-lg">{v}</div>
    </div>
  );
}

export default function Library() {
  const [spec, setSpec] = useState('All');
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => PROTOCOLS.filter(p =>
    (spec === 'All' || p.spec === spec) &&
    (q === '' || p.name.toLowerCase().includes(q.toLowerCase()))
  ), [spec, q]);

  const sel = filtered[active] || filtered[0];

  return (
    <section id="library" style={{ padding: '80px 0' }}>
      <div className="container-ed">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-6">
          <div className="max-w-xl">
            <div className="eyebrow mb-4">The Library</div>
            <h2 className="serif" style={{ fontSize: 'var(--fs-h1)' }}>
              50+ protocols.{' '}
              <em className="italic" style={{ color: 'var(--ink-3)' }}>Edit any of them in plain English.</em>
            </h2>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search protocols…"
            className="w-full sm:w-auto"
            style={{
              padding: '12px 18px',
              borderRadius: 999,
              border: '1px solid var(--rule)',
              background: 'var(--paper)',
              fontSize: 14,
              color: 'var(--ink)',
              fontFamily: 'var(--sans)',
              minWidth: 240,
            }}
          />
        </div>

        {/* Spec filter */}
        <div className="flex gap-1.5 flex-wrap mb-6 pb-6" style={{ borderBottom: '1px solid var(--rule)' }}>
          {SPECS.map(s => (
            <button
              key={s}
              onClick={() => { setSpec(s); setActive(0); }}
              className="rounded-full text-sm transition-all duration-150"
              style={{
                padding: '8px 14px',
                background: spec === s ? 'var(--ink)' : 'transparent',
                color: spec === s ? 'var(--paper)' : 'var(--ink-2)',
                border: `1px solid ${spec === s ? 'var(--ink)' : 'var(--rule)'}`,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
          {/* List */}
          <div className="flex flex-col gap-px rounded-xl overflow-hidden" style={{ background: 'var(--rule)', border: '1px solid var(--rule)' }}>
            {filtered.map((p, i) => (
              <button
                key={p.name}
                onClick={() => setActive(i)}
                className="text-left transition-colors duration-150"
                style={{
                  background: active === i ? 'var(--paper-2)' : 'var(--paper)',
                  padding: '16px 18px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: 12,
                  alignItems: 'center',
                  borderLeft: active === i ? '3px solid var(--accent)' : '3px solid transparent',
                }}
              >
                <div>
                  <div className="text-sm font-medium mb-0.5">{p.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
                    {p.spec.toUpperCase()} · {p.lang.map(l => l.toUpperCase()).join(' / ')}
                  </div>
                </div>
                <div className="mono hidden sm:block" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  {p.uses.toLocaleString('en-IN')} uses
                </div>
                <span style={{ color: 'var(--ink-3)', fontSize: 16 }}>›</span>
              </button>
            ))}
          </div>

          {/* Preview */}
          {sel && (
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="rounded-2xl p-6 lg:p-7" style={{ background: 'var(--paper-2)', border: '1px solid var(--rule)' }}>
                <div className="mono mb-2" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)' }}>
                  PROTOCOL · {sel.spec.toUpperCase()}
                </div>
                <h3 className="serif mb-3" style={{ fontSize: 28 }}>{sel.name}</h3>
                <p className="mb-6" style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>{sel.preview}</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <Stat k="Used by" v={`${Math.round(sel.uses / 100)} clinics`} />
                  <Stat k="Languages" v={sel.lang.join(' + ').toUpperCase()} />
                  <Stat k="Avg reply" v="1.2s" />
                  <Stat k="Patient sat" v="94%" />
                </div>

                <div className="rounded-lg p-4" style={{ background: 'var(--paper)', border: '1px solid var(--rule)' }}>
                  <div className="mono uppercase mb-3" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--accent-deep)' }}>
                    Protocol reply · written in plain words
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink)', fontFamily: 'var(--sans)' }}>
                    <div className="font-semibold mb-2">{sel.name}</div>
                    <div style={{ color: 'var(--ink-2)' }}>
                      {sel.replyEn}
                    </div>
                    {sel.lang.includes('hi') && (
                      <>
                        <div className="my-3.5" style={{ height: 1, background: 'var(--rule)' }} />
                        <div className="font-semibold mb-2">{sel.name} · हिंदी</div>
                        <div style={{ color: 'var(--ink-2)' }}>
                          {sel.replyHi}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mono mt-3.5" style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
                    ↳ No code. No if-else. Just how you&apos;d tell the patient yourself.
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
