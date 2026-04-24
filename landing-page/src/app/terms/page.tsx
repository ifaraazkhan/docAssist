'use client';

import Logo from '@/components/Logo';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      {/* Header */}
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
          <Link href="/">
            <Logo />
          </Link>
          <Link
            href="/"
            className="mono"
            style={{ fontSize: 12, color: 'var(--ink-2)', letterSpacing: '0.04em' }}
          >
            ← Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container-ed" style={{ maxWidth: 760, padding: '64px 32px 96px' }}>
        <div className="eyebrow mb-6">Legal</div>
        <h1
          style={{
            fontSize: 'var(--fs-h1)',
            fontWeight: 500,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            marginBottom: 16,
          }}
        >
          Terms of Service
        </h1>
        <p className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.04em', marginBottom: 48 }}>
          Last updated: 24 April 2026
        </p>

        <div className="flex flex-col gap-10" style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink-2)' }}>
          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              1. Acceptance of terms
            </h2>
            <p>
              By accessing or using DrCliniq (&quot;the Service&quot;), you agree to be bound by these Terms of Service. The Service is operated by Yesinfosolutions (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). If you do not agree with these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              2. Description of Service
            </h2>
            <p>
              DrCliniq is an AI-powered WhatsApp automation platform for Indian clinics. The Service enables doctors to configure medical response protocols, automate patient WhatsApp replies, triage urgent cases, book appointments, and receive morning briefings — all through the WhatsApp Business API.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              3. Eligibility
            </h2>
            <p style={{ marginBottom: 12 }}>To use DrCliniq, you must:</p>
            <ul style={{ paddingLeft: 20, listStyleType: 'disc' }} className="flex flex-col gap-2">
              <li>Be a registered medical practitioner in India, or an authorised representative of a registered clinic.</li>
              <li>Hold a valid NMC (National Medical Commission) registration, or equivalent state medical council registration.</li>
              <li>Be at least 18 years of age.</li>
              <li>Have a valid WhatsApp Business account or be willing to set one up.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              4. Doctor responsibilities
            </h2>
            <p style={{ marginBottom: 12 }}>As a doctor using DrCliniq, you are responsible for:</p>
            <ul style={{ paddingLeft: 20, listStyleType: 'disc' }} className="flex flex-col gap-2">
              <li><strong>Protocol accuracy</strong> — Ensuring all auto-reply protocols you create are medically accurate, appropriate, and comply with NMC guidelines.</li>
              <li><strong>Patient consent</strong> — Obtaining patient consent for automated WhatsApp communication as required under DPDP Act.</li>
              <li><strong>Urgent case follow-up</strong> — Reviewing and acting on cases flagged as urgent by the AI system in a timely manner.</li>
              <li><strong>Account security</strong> — Keeping your login credentials confidential and notifying us immediately of unauthorised access.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              5. AI disclaimer
            </h2>
            <div
              style={{
                padding: 20,
                borderRadius: 8,
                border: '1px solid var(--rule)',
                background: 'var(--paper-2)',
                lineHeight: 1.7,
              }}
            >
              <p>
                DrCliniq&apos;s AI is a <strong>clinical assistant tool</strong>, not a replacement for medical judgment. All AI-generated replies are based on protocols configured by the doctor. The AI does not diagnose, prescribe, or provide independent medical advice. The doctor remains solely responsible for all patient communication and clinical decisions.
              </p>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              6. Subscription &amp; payments
            </h2>
            <ul style={{ paddingLeft: 20, listStyleType: 'disc' }} className="flex flex-col gap-2">
              <li><strong>Free tier</strong> — The Starter plan includes limited AI replies per month at no cost.</li>
              <li><strong>Paid plans</strong> — Pro and higher plans are billed monthly or annually. Prices are in Indian Rupees (₹) inclusive of applicable taxes.</li>
              <li><strong>Payment processing</strong> — Payments are processed securely through Razorpay. We do not store credit/debit card details.</li>
              <li><strong>Refunds</strong> — Subscription fees are non-refundable. You may cancel at any time, and access continues until the end of the billing period.</li>
              <li><strong>Price changes</strong> — We may revise pricing with 30 days&apos; notice via email.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              7. Prohibited use
            </h2>
            <p style={{ marginBottom: 12 }}>You may not use DrCliniq to:</p>
            <ul style={{ paddingLeft: 20, listStyleType: 'disc' }} className="flex flex-col gap-2">
              <li>Send unsolicited promotional messages or spam to patients.</li>
              <li>Share patient data with unauthorised third parties.</li>
              <li>Create protocols that provide dangerous, misleading, or fraudulent medical information.</li>
              <li>Reverse-engineer, scrape, or attempt to extract the AI model or proprietary systems.</li>
              <li>Violate any applicable Indian law, NMC guidelines, or WhatsApp Business policies.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              8. Service availability
            </h2>
            <p>
              We aim for 99.9% uptime but do not guarantee uninterrupted service. We depend on third-party services (WhatsApp Business API, cloud providers) that may experience outages beyond our control. We will notify users of planned maintenance via email or in-app notification.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              9. Limitation of liability
            </h2>
            <p>
              To the maximum extent permitted by Indian law, Yesinfosolutions shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Service. Our total liability shall not exceed the fees paid by you in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              10. Termination
            </h2>
            <p>
              We may suspend or terminate your account if you violate these terms, engage in prohibited use, or fail to pay subscription fees. Upon termination, your data will be retained for 30 days to allow export, after which it will be permanently deleted (subject to legal retention requirements).
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              11. Governing law
            </h2>
            <p>
              These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              12. Contact
            </h2>
            <p>For questions about these terms:</p>
            <div
              className="mono mt-4"
              style={{
                padding: 20,
                borderRadius: 8,
                border: '1px solid var(--rule)',
                background: 'var(--paper-2)',
                fontSize: 13,
                lineHeight: 1.8,
                letterSpacing: '0.02em',
              }}
            >
              <div>Yesinfosolutions</div>
              <div style={{ color: 'var(--accent)' }}>legal@drcliniq.in</div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
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
