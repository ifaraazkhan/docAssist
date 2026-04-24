'use client';

import Logo from '@/components/Logo';
import Link from 'next/link';
import { ReactNode } from 'react';

interface BlogPostLayoutProps {
  tag: string;
  date: string;
  readTime: string;
  title: ReactNode;
  children: ReactNode;
}

export default function BlogPostLayout({ tag, date, readTime, title, children }: BlogPostLayoutProps) {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'color-mix(in oklch, var(--paper) 92%, transparent)',
          backdropFilter: 'saturate(140%) blur(14px)',
          WebkitBackdropFilter: 'saturate(140%) blur(14px)',
          borderBottom: '1px solid var(--rule)',
        }}
      >
        <div className="container-ed flex items-center justify-between h-16">
          <Link href="/"><Logo /></Link>
          <Link href="/blog" className="mono" style={{ fontSize: 12, color: 'var(--ink-2)', letterSpacing: '0.04em' }}>
            ← All posts
          </Link>
        </div>
      </header>

      <article className="container-ed" style={{ maxWidth: 720, padding: '64px 32px 96px' }}>
        <div className="flex items-center gap-3 mb-6">
          <span
            className="mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              padding: '2px 8px',
              borderRadius: 4,
              background: 'var(--accent-soft)',
            }}
          >
            {tag}
          </span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
            {date} · {readTime}
          </span>
        </div>

        <h1
          style={{
            fontSize: 'var(--fs-h1)',
            fontWeight: 500,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: 24,
          }}
        >
          {title}
        </h1>

        <div
          className="blog-content flex flex-col gap-8"
          style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--ink-2)' }}
        >
          {children}
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 64,
            padding: 32,
            borderRadius: 12,
            background: 'var(--paper-2)',
            border: '1px solid var(--rule)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontWeight: 500, fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>
            Ready to automate your clinic?
          </p>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 20 }}>
            Set up DrCliniq in 5 minutes. No credit card required.
          </p>
          <Link
            href="/#signup"
            className="btn-ed btn-primary-ed"
            style={{ display: 'inline-flex', padding: '10px 24px', fontSize: 14 }}
          >
            Start for Free →
          </Link>
        </div>
      </article>

      <div
        className="container-ed mono text-center"
        style={{
          padding: '24px 32px',
          borderTop: '1px solid var(--rule)',
          fontSize: 11,
          color: 'var(--ink-3)',
          letterSpacing: '0.04em',
        }}
      >
        © 2026 Yesinfosolutions. All rights reserved.
      </div>
    </div>
  );
}
