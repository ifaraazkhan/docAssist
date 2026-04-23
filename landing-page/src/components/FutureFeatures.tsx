'use client';

import { useState, useEffect, useRef } from 'react';

const MENU_OPTIONS = [
  { icon: '🤒', label: 'Fever & Cold' },
  { icon: '🤕', label: 'Headache & Migraine' },
  { icon: '💊', label: 'BP & Sugar Check' },
  { icon: '🤢', label: 'Stomach & Vomiting' },
  { icon: '🏥', label: 'About Clinic' },
];

type Step =
  | { type: 'patient'; text: string }
  | { type: 'bot'; text: string }
  | { type: 'button'; label: string }
  | { type: 'menu' }
  | { type: 'selected'; label: string }
  | { type: 'prescription'; text: string }
  | { type: 'disclaimer'; text: string };

const SEQUENCE: Step[] = [
  { type: 'patient', text: 'Hi' },
  { type: 'bot', text: 'Namaste! 🙏 Welcome to Sharma Clinic.\n\nHow can we help you today? Tap below to choose:' },
  { type: 'button', label: '📋 View Options' },
  { type: 'menu' },
  { type: 'selected', label: 'Fever & Cold' },
  { type: 'prescription', text: '🩺 *Fever & Cold Protocol*\n\n• Tab Paracetamol 500mg — 1 tab every 6 hrs (if temp > 100°F)\n• Tab Cetirizine 10mg — 1 at night\n• Steam inhalation 2x daily\n• Plenty of warm fluids\n\n_Duration: 3 days_\n\nIf no relief in 48hrs, please visit clinic.' },
  { type: 'disclaimer', text: '⚕️ This is informational only — not a substitute for an in-person consultation.' },
];

// Delays in ms before showing the NEXT step
const DELAYS = [1200, 800, 600, 1600, 500, 1000, 800];

export default function FutureFeatures() {
  const [step, setStep] = useState(0);
  const [menuSelected, setMenuSelected] = useState(-1);
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-advance through steps
  useEffect(() => {
    // If we've shown all steps, restart after a pause
    if (step >= SEQUENCE.length - 1) {
      const t = setTimeout(() => {
        setStep(0);
        setMenuSelected(-1);
        setShowMenuSheet(false);
      }, 5000);
      return () => clearTimeout(t);
    }

    const current = SEQUENCE[step];

    // At the menu step: show bottom sheet, then wait for "selection"
    if (current.type === 'menu') {
      // Show menu sheet after short delay
      const t1 = setTimeout(() => setShowMenuSheet(true), 300);
      // Highlight first option after a bit
      const t2 = setTimeout(() => setMenuSelected(0), 1200);
      // Then "send" and advance
      const t3 = setTimeout(() => {
        setShowMenuSheet(false);
        setMenuSelected(-1);
        setStep(s => s + 1);
      }, 2800);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }

    // For all other steps, advance after the configured delay
    const delay = DELAYS[step] ?? 1000;
    const t = setTimeout(() => setStep(s => s + 1), delay);
    return () => clearTimeout(t);
  }, [step]);

  // Auto-scroll chat to bottom when step changes
  useEffect(() => {
    if (chatRef.current) {
      setTimeout(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 50);
    }
  }, [step]);

  const visible = SEQUENCE.slice(0, step + 1);

  return (
    <section
      id="upcoming"
      style={{
        padding: '80px 0',
        background: 'var(--paper)',
        borderTop: '1px solid var(--rule)',
      }}
    >
      {/* Global keyframes for this section */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wa-fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wa-slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes wa-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .wa-msg-enter {
          animation: wa-fadeUp 350ms cubic-bezier(.2,.8,.2,1) both;
        }
      `}} />

      <div className="container-ed">
        {/* Header */}
        <div className="max-w-xl mb-10">
          <div className="eyebrow mb-4">How it works on WhatsApp</div>
          <h2 className="serif" style={{ fontSize: 'var(--fs-h1)' }}>
            Your patient taps.{' '}
            <em className="italic" style={{ color: 'var(--accent)' }}>DrCliniq replies.</em>
          </h2>
          <p className="mt-4" style={{ fontSize: 17, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            Interactive menus on WhatsApp — patients pick from your protocols, get instant prescriptions. No app downloads, no training.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-14 items-center">
          {/* LEFT: Explanation steps */}
          <div className="flex flex-col gap-6">
            {[
              { num: '01', title: 'Patient sends "Hi"', desc: 'They message your WhatsApp Business number — just like texting a friend.' },
              { num: '02', title: 'Interactive menu appears', desc: 'DrCliniq shows a clean options list: Fever & Cold, Headache, BP Check, and more. You define these protocols.' },
              { num: '03', title: 'Patient taps their concern', desc: 'One tap — no typing needed. Works even on basic phones with slow connections.' },
              { num: '04', title: 'Instant prescription reply', desc: 'Your pre-approved protocol fires back in seconds. Medicine, dosage, duration — all formatted and clear.' },
            ].map((item, idx) => {
              // Highlight the step that matches current animation phase
              const activeStep = step <= 0 ? 0 : step <= 2 ? 1 : step <= 4 ? 2 : 3;
              const isActive = idx === activeStep;
              return (
                <div
                  key={item.num}
                  className="flex gap-4 items-start transition-all duration-500"
                  style={{ opacity: isActive ? 1 : 0.45 }}
                >
                  <div
                    className="mono shrink-0 grid place-items-center rounded-lg font-semibold transition-colors duration-500"
                    style={{
                      width: 40,
                      height: 40,
                      background: isActive ? 'var(--accent)' : 'var(--accent-soft)',
                      color: isActive ? 'white' : 'var(--accent)',
                      fontSize: 13,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {item.num}
                  </div>
                  <div>
                    <div className="font-medium text-base" style={{ color: 'var(--ink)' }}>{item.title}</div>
                    <div className="mt-1" style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: WhatsApp phone with interactive menu animation */}
          <div className="flex justify-center lg:sticky lg:top-24">
            <div
              className="relative"
              style={{
                width: 360,
                maxWidth: '100%',
                background: '#0d0d0d',
                borderRadius: 44,
                padding: 10,
                boxShadow: '0 40px 80px -30px rgba(20,30,40,0.35)',
              }}
            >
              {/* Dynamic Island */}
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 100,
                  height: 24,
                  background: '#0d0d0d',
                  borderRadius: 14,
                  zIndex: 10,
                }}
              />

              <div
                className="relative overflow-hidden"
                style={{
                  background: '#e5ddd5',
                  borderRadius: 36,
                  height: 640,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M30 30 L40 40 M60 60 L70 70 M20 70 L30 60' stroke='%23d4ccc4' stroke-width='1' opacity='0.4'/%3E%3C/svg%3E")`,
                }}
              >
                {/* WA Header */}
                <div
                  className="flex items-center gap-3"
                  style={{ background: '#075e54', color: 'white', padding: '44px 14px 12px' }}
                >
                  <span style={{ fontSize: 18 }}>‹</span>
                  <div
                    className="grid place-items-center rounded-full"
                    style={{ width: 36, height: 36, background: '#dcf8c6', color: '#075e54', fontSize: 14, fontWeight: 700 }}
                  >
                    Dr
                  </div>
                  <div className="flex-1" style={{ lineHeight: 1.2 }}>
                    <div className="font-medium" style={{ fontSize: 15 }}>Sharma Clinic</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>online</div>
                  </div>
                  <span style={{ fontSize: 16 }}>📞</span>
                  <span style={{ fontSize: 16, marginLeft: 8 }}>⋮</span>
                </div>

                {/* Chat area */}
                <div
                  ref={chatRef}
                  className="flex flex-col gap-2"
                  style={{
                    padding: '10px 12px 60px',
                    height: 'calc(100% - 70px)',
                    overflowY: 'auto',
                    scrollBehavior: 'smooth',
                  }}
                >
                  {/* Date pill */}
                  <div className="self-center" style={{
                    background: '#e1f3fb',
                    color: '#54656f',
                    padding: '3px 12px',
                    borderRadius: 8,
                    fontSize: 11,
                    margin: '4px 0 8px',
                  }}>
                    TODAY
                  </div>

                  {visible.map((s, i) => {
                    if (s.type === 'patient') {
                      return (
                        <div key={`${step}-${i}`} className="self-end wa-msg-enter" style={{ maxWidth: '75%' }}>
                          <div style={{
                            background: '#dcf8c6',
                            padding: '8px 12px 5px',
                            borderRadius: '8px 2px 8px 8px',
                            boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                            fontSize: 14,
                            color: '#111',
                          }}>
                            {s.text}
                            <div style={{ fontSize: 10, color: '#888', textAlign: 'right', marginTop: 2 }}>9:41 ✓✓</div>
                          </div>
                        </div>
                      );
                    }
                    if (s.type === 'bot') {
                      return (
                        <div key={`${step}-${i}`} className="self-start wa-msg-enter" style={{ maxWidth: '85%' }}>
                          <div style={{
                            background: 'white',
                            padding: '8px 12px 5px',
                            borderRadius: '2px 8px 8px 8px',
                            boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                            fontSize: 13.5,
                            color: '#111',
                            lineHeight: 1.45,
                            whiteSpace: 'pre-wrap',
                          }}>
                            {s.text}
                            <div style={{ fontSize: 10, color: '#888', textAlign: 'right', marginTop: 2 }}>9:41</div>
                          </div>
                        </div>
                      );
                    }
                    if (s.type === 'button') {
                      return (
                        <div key={`${step}-${i}`} className="self-start wa-msg-enter" style={{ maxWidth: '85%' }}>
                          <div
                            style={{
                              background: 'white',
                              border: '1px solid #d1d7db',
                              borderRadius: 8,
                              overflow: 'hidden',
                              boxShadow: '0 1px 0.5px rgba(0,0,0,0.08)',
                            }}
                          >
                            <div
                              className="flex items-center justify-center gap-2"
                              style={{
                                padding: '10px 16px',
                                color: '#00a884',
                                fontWeight: 500,
                                fontSize: 14,
                              }}
                            >
                              <span style={{ fontSize: 12 }}>☰</span>
                              {s.label}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    if (s.type === 'selected') {
                      return (
                        <div key={`${step}-${i}`} className="self-end wa-msg-enter" style={{ maxWidth: '75%' }}>
                          <div style={{
                            background: '#dcf8c6',
                            padding: '8px 12px 5px',
                            borderRadius: '8px 2px 8px 8px',
                            boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                            fontSize: 14,
                            color: '#111',
                          }}>
                            <div style={{ borderLeft: '3px solid #075e54', paddingLeft: 8, marginBottom: 4, fontSize: 11, color: '#555' }}>
                              📋 View Options
                            </div>
                            🤒 {s.label}
                            <div style={{ fontSize: 10, color: '#888', textAlign: 'right', marginTop: 2 }}>9:42 ✓✓</div>
                          </div>
                        </div>
                      );
                    }
                    if (s.type === 'prescription') {
                      return (
                        <div key={`${step}-${i}`} className="self-start wa-msg-enter" style={{ maxWidth: '88%' }}>
                          <div style={{
                            background: 'white',
                            padding: '8px 12px 5px',
                            borderRadius: '2px 8px 8px 8px',
                            boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                            fontSize: 13,
                            color: '#111',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                          }}>
                            {s.text.split(/(\*[^*]+\*|_[^_]+_)/g).map((part, j) => {
                              if (part.startsWith('*') && part.endsWith('*')) return <strong key={j}>{part.slice(1, -1)}</strong>;
                              if (part.startsWith('_') && part.endsWith('_')) return <em key={j}>{part.slice(1, -1)}</em>;
                              return <span key={j}>{part}</span>;
                            })}
                            <div style={{ fontSize: 10, color: '#888', textAlign: 'right', marginTop: 2 }}>9:42</div>
                          </div>
                        </div>
                      );
                    }
                    if (s.type === 'disclaimer') {
                      return (
                        <div key={`${step}-${i}`} className="self-start wa-msg-enter" style={{ maxWidth: '88%' }}>
                          <div style={{
                            background: '#fff8e1',
                            padding: '6px 10px',
                            borderRadius: '2px 8px 8px 8px',
                            boxShadow: '0 1px 0.5px rgba(0,0,0,0.08)',
                            fontSize: 11,
                            color: '#7a6520',
                            lineHeight: 1.45,
                          }}>
                            {s.text}
                          </div>
                        </div>
                      );
                    }
                    if (s.type === 'menu') return null;
                    return null;
                  })}
                </div>

                {/* Bottom sheet menu overlay */}
                {showMenuSheet && (
                  <div
                    className="absolute inset-0 flex flex-col justify-end"
                    style={{ background: 'rgba(0,0,0,0.35)', zIndex: 20, animation: 'wa-fadeIn 200ms ease both' }}
                  >
                    <div
                      style={{
                        background: 'white',
                        borderRadius: '16px 16px 0 0',
                        padding: '16px 0 20px',
                        animation: 'wa-slideUp 350ms cubic-bezier(.2,.8,.2,1)',
                      }}
                    >
                      {/* Handle */}
                      <div className="flex justify-center mb-3">
                        <div style={{ width: 36, height: 4, borderRadius: 999, background: '#ddd' }} />
                      </div>
                      {/* Title */}
                      <div className="px-5 mb-3">
                        <div style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>Sharma Clinic</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Select an option</div>
                      </div>
                      <div style={{ borderTop: '1px solid #eee' }} />
                      {/* Menu items */}
                      <div className="px-3 pt-2">
                        {MENU_OPTIONS.map((opt, i) => (
                          <div
                            key={opt.label}
                            className="flex items-center gap-3 rounded-xl transition-all duration-300"
                            style={{
                              padding: '12px 14px',
                              background: i === 0 && menuSelected >= 0 ? '#f0faf8' : 'transparent',
                              border: i === 0 && menuSelected >= 0 ? '1.5px solid #00a884' : '1.5px solid transparent',
                            }}
                          >
                            <span style={{ fontSize: 18 }}>{opt.icon}</span>
                            <span style={{ fontSize: 14, color: '#111', fontWeight: i === 0 && menuSelected >= 0 ? 600 : 400 }}>{opt.label}</span>
                            {/* Radio circle */}
                            <div
                              className="ml-auto rounded-full transition-all duration-300"
                              style={{
                                width: 20,
                                height: 20,
                                border: i === 0 && menuSelected >= 0 ? '2px solid #00a884' : '2px solid #ccc',
                                background: i === 0 && menuSelected >= 0 ? '#00a884' : 'transparent',
                                display: 'grid',
                                placeItems: 'center',
                              }}
                            >
                              {i === 0 && menuSelected >= 0 && (
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Send button */}
                      {menuSelected >= 0 && (
                        <div className="px-5 mt-3" style={{ animation: 'wa-fadeUp 300ms ease both' }}>
                          <div
                            className="text-center font-medium rounded-full"
                            style={{
                              padding: '12px 0',
                              background: '#00a884',
                              color: 'white',
                              fontSize: 15,
                            }}
                          >
                            Send
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Input bar */}
                <div className="absolute bottom-0 left-0 right-0 flex gap-2" style={{ padding: 8, background: '#f0f0f0', zIndex: 5 }}>
                  <div
                    className="flex-1 flex justify-between items-center rounded-full"
                    style={{ background: 'white', padding: '8px 14px', fontSize: 13, color: '#aaa' }}
                  >
                    <span>Message</span>
                    <span>📎</span>
                  </div>
                  <div
                    className="grid place-items-center rounded-full text-white"
                    style={{ width: 36, height: 36, background: '#075e54', fontSize: 15 }}
                  >
                    🎤
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
