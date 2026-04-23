'use client';

import Logo from './Logo';

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--rule)', padding: '56px 0 32px', background: 'var(--paper)' }}>
      <div className="container-ed">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10 mb-12">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Logo />
            <p className="mt-4 text-sm max-w-[280px]" style={{ color: 'var(--ink-3)', lineHeight: 1.5 }}>
              An operating system for solo Indian clinics. Not a chatbot. A clinical assistant that lives in WhatsApp.
            </p>
            <div className="mono mt-6" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
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
              <div className="mono mb-4" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                {g.h}
              </div>
              <ul className="flex flex-col gap-2.5" style={{ listStyle: 'none', padding: 0, fontSize: 13 }}>
                {g.l.map(i => (
                  <li key={i}>
                    <a className="u-link cursor-pointer" style={{ color: 'var(--ink-2)' }}>{i}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 text-xs"
          style={{ borderTop: '1px solid var(--rule)', color: 'var(--ink-3)' }}
        >
          <div>© 2026 DrCliniq Technologies Pvt Ltd.</div>
          <div className="mono" style={{ letterSpacing: '0.04em' }}>v3.0 · Apr 2026</div>
        </div>
      </div>
    </footer>
  );
}
