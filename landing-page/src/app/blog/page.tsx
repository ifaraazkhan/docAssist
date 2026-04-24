'use client';

import Logo from '@/components/Logo';
import Link from 'next/link';

const posts = [
  {
    slug: 'whatsapp-automation-for-doctors-india',
    title: 'WhatsApp Automation for Doctors in India: The Complete 2026 Guide',
    excerpt: 'How Indian doctors are using AI-powered WhatsApp automation to handle 80% of patient queries automatically — without missing a single urgent case.',
    date: '24 Apr 2026',
    readTime: '8 min read',
    tag: 'Guide',
  },
  {
    slug: 'ai-chatbot-healthcare-india',
    title: 'AI Chatbots in Indian Healthcare: What Actually Works in 2026',
    excerpt: 'Generic chatbots fail in Indian clinics. Here\'s why LLM-powered, protocol-based AI assistants on WhatsApp are the only model that works — and what to look for.',
    date: '23 Apr 2026',
    readTime: '7 min read',
    tag: 'AI & LLM',
  },
  {
    slug: 'dpdp-compliance-clinics-guide',
    title: 'DPDP Act Compliance for Clinics: What Every Indian Doctor Must Know',
    excerpt: 'The Digital Personal Data Protection Act is live. Here\'s a practical checklist for clinics — covering patient consent, data storage, WhatsApp messaging, and penalties.',
    date: '22 Apr 2026',
    readTime: '6 min read',
    tag: 'Compliance',
  },
  {
    slug: 'reduce-patient-no-shows-whatsapp',
    title: 'How to Reduce Patient No-Shows by 40% Using WhatsApp Reminders',
    excerpt: 'Indian clinics lose ₹2–5 lakh/year to no-shows. Automated WhatsApp reminders with smart follow-ups are cutting that number in half. Here\'s the playbook.',
    date: '21 Apr 2026',
    readTime: '5 min read',
    tag: 'Growth',
  },
];

export default function BlogIndex() {
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
          <Link href="/" className="mono" style={{ fontSize: 12, color: 'var(--ink-2)', letterSpacing: '0.04em' }}>
            ← Back to home
          </Link>
        </div>
      </header>

      <div className="container-ed" style={{ maxWidth: 760, padding: '64px 32px 96px' }}>
        <div className="eyebrow mb-6">Blog</div>
        <h1
          style={{
            fontSize: 'var(--fs-h1)',
            fontWeight: 500,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            marginBottom: 12,
          }}
        >
          Insights for{' '}
          <span style={{ color: 'var(--accent)' }}>modern clinics</span>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 48, maxWidth: 520 }}>
          AI, automation, compliance, and growth — written for Indian doctors who want their clinic to run smarter.
        </p>

        <div className="flex flex-col gap-0">
          {posts.map((post, i) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block"
              style={{
                padding: '32px 0',
                borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
                borderBottom: '1px solid var(--rule)',
              }}
            >
              <div className="flex items-center gap-3 mb-3">
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
                  {post.tag}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
                  {post.date} · {post.readTime}
                </span>
              </div>
              <h2
                className="group-hover:underline"
                style={{
                  fontSize: 'var(--fs-h3)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                  marginBottom: 8,
                  color: 'var(--ink)',
                }}
              >
                {post.title}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                {post.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </div>

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
