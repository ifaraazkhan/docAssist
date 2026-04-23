'use client';

import { useState, useEffect } from 'react';
import Logo from './Logo';
import { useISTClock } from '@/lib/hooks';

function LiveTicker() {
  const { time, after } = useISTClock();
  const [count, setCount] = useState(2847);

  useEffect(() => {
    const id = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3) + 1), 2200);
    return () => clearInterval(id);
  }, []);

  const items = [
    <span key="ist"><span className="live-dot mr-2 align-middle" /> IST {time} — it&apos;s {after ? 'after-hours' : 'clinic-hours'}, AI is on duty</span>,
    <span key="count">{count.toLocaleString('en-IN')} replies handled today</span>,
    <span key="docs">1,284 doctors are off-clock right now. Their inboxes aren&apos;t.</span>,
    <span key="sharma">Dr Sharma, Lucknow — 47 messages auto-handled in the last hour</span>,
    <span key="monsoon">Monsoon protocol active in 6 cities</span>,
    <span key="comp">NMC + DPDP + ABDM compliant</span>,
  ];

  return (
    <div
      className="mono overflow-hidden whitespace-nowrap"
      style={{
        borderTop: '1px solid var(--rule)',
        borderBottom: '1px solid var(--rule)',
        background: 'var(--paper-2)',
        fontSize: 12,
        letterSpacing: '0.02em',
        color: 'var(--ink-2)',
      }}
    >
      <div
        className="inline-flex gap-14 py-2.5"
        style={{ animation: 'marquee 60s linear infinite' }}
      >
        {[0, 1].map(k => (
          <div key={k} className="inline-flex gap-14">
            {items}
          </div>
        ))}
      </div>
    </div>
  );
}

const NAV_LINKS = [
  { label: 'Live demo', href: '#demo' },
  { label: 'AI', href: '#pain' },
  { label: 'Protocols', href: '#library' },
  { label: 'Pricing', href: '#pricing' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-50 transition-colors duration-200"
        style={{
          background: 'color-mix(in oklch, var(--paper) 92%, transparent)',
          backdropFilter: 'saturate(140%) blur(14px)',
          WebkitBackdropFilter: 'saturate(140%) blur(14px)',
          borderBottom: scrolled ? '1px solid var(--rule)' : '1px solid transparent',
        }}
      >
        <div className="container-ed flex items-center justify-between h-16">
          <Logo />

          <nav className="hidden md:flex gap-7 text-sm" style={{ color: 'var(--ink-2)' }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="u-link">{l.label}</a>
            ))}
          </nav>

          <div className="hidden md:flex gap-2.5 items-center">
            <a href="#signup" className="btn-ed btn-primary-ed text-sm">Start for Free</a>
          </div>

          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-0.5 bg-current transition-transform duration-200" style={{ transform: mobileOpen ? 'rotate(45deg) translateY(4px)' : 'none' }} />
            <span className="block w-5 h-0.5 bg-current transition-opacity duration-200" style={{ opacity: mobileOpen ? 0 : 1 }} />
            <span className="block w-5 h-0.5 bg-current transition-transform duration-200" style={{ transform: mobileOpen ? 'rotate(-45deg) translateY(-4px)' : 'none' }} />
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t" style={{ borderColor: 'var(--rule)', background: 'var(--paper)' }}>
            <div className="container-ed py-4 flex flex-col gap-4">
              {NAV_LINKS.map(l => (
                <a key={l.label} href={l.href} className="text-base py-2" style={{ color: 'var(--ink-2)' }} onClick={() => setMobileOpen(false)}>
                  {l.label}
                </a>
              ))}
              <a href="#signup" className="btn-ed btn-primary-ed text-sm w-full text-center justify-center">
                Get early access
              </a>
            </div>
          </div>
        )}
      </header>
      <LiveTicker />
    </>
  );
}
