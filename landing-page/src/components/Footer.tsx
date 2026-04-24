'use client';

import Logo from './Logo';
import Link from 'next/link';

const footerGroups = [
  {
    h: 'Product',
    l: [
      { label: 'Live demo', href: '#demo' },
      { label: 'How it works', href: '#pain' },
      { label: 'Protocols', href: '#library' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Get started', href: '#signup' },
    ],
  },
  {
    h: 'Company',
    l: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: 'mailto:hello@drcliniq.in' },
    ],
  },
  {
    h: 'Legal',
    l: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'DPDP', href: '/privacy' },
      { label: 'Security', href: '#' },
    ],
  },
  {
    h: 'Connect',
    l: [
      { label: 'WhatsApp', href: '#' },
      { label: 'Twitter / X', href: '#' },
      { label: 'LinkedIn', href: '#' },
      { label: 'Email', href: 'mailto:hello@drcliniq.in' },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--rule)', padding: '56px 0 32px', background: 'var(--paper)' }}>
      <div className="container-ed">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10 mb-12">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Logo />
            <p className="mt-4 text-sm max-w-[280px]" style={{ color: 'var(--ink-3)', lineHeight: 1.5 }}>
              An operating system for Indian clinics and Doctors. Not a chatbot. A clinical assistant that lives in WhatsApp.
            </p>
            <div className="mono mt-6" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
              Made with ♡ in India
            </div>
          </div>

          {footerGroups.map(g => (
            <div key={g.h}>
              <div className="mono mb-4" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                {g.h}
              </div>
              <ul className="flex flex-col gap-2.5" style={{ listStyle: 'none', padding: 0, fontSize: 13 }}>
                {g.l.map(i => (
                  <li key={i.label}>
                    {i.href.startsWith('/') || i.href.startsWith('mailto:') ? (
                      <Link href={i.href} className="u-link cursor-pointer" style={{ color: 'var(--ink-2)' }}>
                        {i.label}
                      </Link>
                    ) : (
                      <a href={i.href} className="u-link cursor-pointer" style={{ color: 'var(--ink-2)' }}>
                        {i.label}
                      </a>
                    )}
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
          <div>© 2026 Yesinfosolutions.</div>
          <div className="mono" style={{ letterSpacing: '0.04em' }}>v3.0 · Apr 2026</div>
        </div>
      </div>
    </footer>
  );
}
