'use client';

import { useState } from 'react';
import PhoneShowcase from './PhoneShowcase';

function Annotation({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`absolute hidden xl:block pointer-events-none z-10 ${className}`}>
      <div
        className="rounded-xl"
        style={{
          maxWidth: 200,
          padding: '14px 16px',
          background: 'var(--paper)',
          border: '1px solid var(--rule)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function Hero() {
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="hero" className="relative" style={{ padding: '40px 0 80px' }}>
      {/* Grid backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.04,
          backgroundImage: 'linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
        }}
      />

      <div className="container-ed relative">
        {/* Top meta row */}
      

       
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-10 items-start">
          {/* LEFT: editorial */}
          <div>
            
            <div className="mono mb-7" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
           <span className="live-dot" />    An Operating System for Indian Clinics
            </div>

            <h1 className="mb-10" style={{ fontSize: 'clamp(30px, 5.5vw, 80px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 0.95 }}>
              Your patients message.{' '}
              DrCliniq{' '}
              <span style={{ color: 'var(--accent)' }}>replies.</span>
            </h1>
            {/* Previous title versions preserved for easy switching:

            -- Option C: medium weight, underlined "replies" --
            <h1 className="mb-10" style={{ fontSize: 'clamp(30px, 5.5vw, 80px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 0.95 }}>
              The clinic that{' '}
              <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--accent)', textUnderlineOffset: '6px', textDecorationThickness: '3px' }}>replies</span>{' '}
              while you are{' '}
              <span style={{ color: 'var(--accent)' }}>busy.</span>
            </h1>

            -- Option B: bold sans, tight tracking --
            <h1 className="mb-10" style={{ fontSize: 'var(--fs-display)', fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.95, paddingTop: 8, paddingBottom: 12 }}>
              The clinic that replies{' '}
              while you are{' '}
              <span style={{ color: 'var(--accent)' }}>busy.</span>
            </h1>

            -- Option A: clean sans, light weight --
            <h1 className="mb-9" style={{ fontSize: 'var(--fs-display)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1.08 }}>
              The clinic that replies{' '}
              while you are{' '}
              <span style={{ color: 'var(--accent)' }}>busy.</span>
            </h1>

            -- Original: serif / magazine --
            <h1 className="serif mb-9" style={{ fontSize: 'var(--fs-display)' }}>
              The clinic that{' '}
              <em className="italic" style={{ color: 'var(--ink-3)' }}>replies</em>{' '}
              while you are{' '}
              <span style={{ color: 'var(--accent)' }}>busy.</span>
            </h1>
            */}

            <p className="mb-9" style={{ fontSize: 19, color: 'var(--ink-2)', maxWidth: 540, lineHeight: 1.55 }}>
              Routine WhatsApp queries handled. Appointments booked. Urgent cases flagged — so you focus on medicine, not your inbox.
            </p>

            {/* Phone signup */}
            {!submitted ? (
              <form
                onSubmit={(e) => { e.preventDefault(); if (phone.length >= 10) setSubmitted(true); }}
                className="mb-4"
              >
                <div
                  className="flex items-stretch gap-0"
                  style={{
                    maxWidth: 480,
                    background: 'var(--paper)',
                    border: '1.5px solid var(--ink)',
                    borderRadius: 999,
                    padding: 5,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="flex items-center gap-1.5 mono shrink-0"
                    style={{ padding: '0 10px', color: 'var(--ink-2)', fontSize: 13, borderRight: '1px solid var(--rule)' }}
                  >
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    aria-label="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    className="mono flex-1 border-none outline-none bg-transparent min-w-0"
                    style={{ padding: '0 16px', fontSize: 16, color: 'var(--ink)', letterSpacing: '0.04em' }}
                  />
                  <button type="submit" className="btn-ed btn-accent-ed hidden sm:inline-flex" style={{ padding: '14px 24px', fontSize: 14 }}>
                    Send setup link
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                  </button>
                </div>
                <button type="submit" className="btn-ed btn-accent-ed sm:hidden w-full mt-3 justify-center" style={{ padding: '14px 24px', fontSize: 14 }}>
                  Send setup link →
                </button>
              </form>
            ) : (
              <div
                className="flex gap-3 items-center mb-4"
                style={{
                  padding: 16,
                  maxWidth: 480,
                  background: 'var(--accent-soft)',
                  borderRadius: 999,
                  color: 'var(--emerald-deep)',
                  fontSize: 14,
                  animation: 'fadeUp 400ms cubic-bezier(.2,.8,.2,1) both',
                }}
              >
                <div className="grid place-items-center rounded-full shrink-0" style={{ width: 32, height: 32, background: 'var(--accent)', color: 'white' }}>✓</div>
                <div className="font-medium">Setup link sent to +91 {phone}. Check WhatsApp.</div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-8" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              <span>No app to install.</span>
              <span className="hidden sm:inline-block rounded-full" style={{ width: 3, height: 3, background: 'var(--ink-3)' }} />
              <span>No card, no commitment.</span>
              <span className="hidden sm:inline-block rounded-full" style={{ width: 3, height: 3, background: 'var(--ink-3)' }} />
              <span>Live in 7 minutes.</span>
            </div>

            {/* Compliance row */}
            <div className="flex gap-4 lg:gap-5 flex-wrap pt-6" style={{ borderTop: '1px solid var(--rule)' }}>
              {['DPDP Compliant', 'NMC Aligned', 'ABDM Coming Soon'].map(c => (
                <div key={c} className="flex items-center gap-1.5 mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                  {c}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: phone */}
          <div className="relative flex justify-center pt-5 px-4 xl:px-16" style={{ minHeight: 620 }}>
            <PhoneShowcase />

            <Annotation className="right-0 xl:-right-12 top-[40px]">
              <div className="mono" style={{ fontSize: 9, letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 4 }}>01 · INPUT</div>
              <div className="text-sm font-medium">Patient writes in Hindi.</div>
              <div className="text-xs" style={{ color: 'var(--ink-3)', marginTop: 2 }}>Auto-detected. No setup.</div>
            </Annotation>

            <Annotation className="left-0 xl:-left-16 top-[240px]">
              <div className="mono" style={{ fontSize: 9, letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 4 }}>02 · BRAIN</div>
              <div className="text-sm font-medium">AI matches a protocol.</div>
              <div className="text-xs" style={{ color: 'var(--ink-3)', marginTop: 2 }}>Pediatric fever_v3.</div>
            </Annotation>

            <Annotation className="right-0 xl:-right-16 bottom-[60px]">
              <div className="mono" style={{ fontSize: 9, letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 4 }}>03 · OUTCOME</div>
              <div className="text-sm font-medium">Booked. You weren&apos;t even online.</div>
              <div className="text-xs" style={{ color: 'var(--ink-3)', marginTop: 2 }}>Average 1.4 sec turnaround.</div>
            </Annotation>
          </div>
        </div>
      </div>
    </section>
  );
}
