'use client';

import { useState, useEffect } from 'react';

export default function StickyFunnel() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 800);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full"
      style={{
        background: 'var(--ink)',
        color: 'var(--paper)',
        padding: '5px 5px 5px 18px',
        boxShadow: '0 20px 50px -20px rgba(0,0,0,0.5)',
        animation: 'fadeUp 400ms cubic-bezier(.2,.8,.2,1) both',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <span className="live-dot" />
      <span className="text-sm hidden sm:inline" style={{ color: 'oklch(0.85 0.01 95)' }}>
        Get DrCliniq on your number
      </span>
      <a
        href="#signup"
        className="btn-ed btn-accent-ed"
        style={{ padding: '10px 18px', fontSize: 13 }}
      >
        Get started →
      </a>
    </div>
  );
}
