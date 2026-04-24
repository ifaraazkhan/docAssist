'use client';

import Logo from '@/components/Logo';
import Link from 'next/link';

export default function PrivacyPolicy() {
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
          Privacy Policy
        </h1>
        <p className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.04em', marginBottom: 48 }}>
          Last updated: 24 April 2026
        </p>

        <div className="flex flex-col gap-10" style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink-2)' }}>
          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              1. Who we are
            </h2>
            <p>
              DrCliniq is a product of <strong>Yesinfosolutions</strong>, a company registered in India. We build AI-powered WhatsApp automation tools exclusively for Indian clinics and healthcare providers.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              2. Data we collect
            </h2>
            <p style={{ marginBottom: 12 }}>We collect the following categories of data:</p>
            <ul style={{ paddingLeft: 20, listStyleType: 'disc' }} className="flex flex-col gap-2">
              <li><strong>Doctor information</strong> — Name, phone number, email, clinic name, specialty, and WhatsApp Business details provided during registration.</li>
              <li><strong>Patient messages</strong> — WhatsApp messages sent by patients to the doctor&apos;s WhatsApp Business number, processed for AI auto-replies and triage.</li>
              <li><strong>Protocol data</strong> — Medical response protocols created by doctors, including keywords, reply templates, and usage statistics.</li>
              <li><strong>Device &amp; usage data</strong> — Browser type, device info, IP address, and usage patterns for service improvement.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              3. How we use your data
            </h2>
            <ul style={{ paddingLeft: 20, listStyleType: 'disc' }} className="flex flex-col gap-2">
              <li>To provide AI-powered auto-replies to patient WhatsApp messages based on doctor-configured protocols.</li>
              <li>To triage and flag urgent patient cases for doctor attention.</li>
              <li>To generate morning briefing summaries and analytics for doctors.</li>
              <li>To manage appointment booking and patient communication workflows.</li>
              <li>To improve our AI models and service quality (using anonymised, aggregated data only).</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              4. Data storage &amp; security
            </h2>
            <p>
              All data is stored on secure servers within India. We use industry-standard encryption (AES-256 at rest, TLS 1.3 in transit) and follow the principle of least privilege for access control. Patient health data is never shared with third parties for marketing or advertising purposes.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              5. DPDP compliance
            </h2>
            <p>
              We comply with the Digital Personal Data Protection Act, 2023 (DPDP Act). As a data fiduciary, we process personal data only for lawful purposes with appropriate consent. Doctors act as data fiduciaries for their patient data, and DrCliniq acts as a data processor on their behalf.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              6. Third-party services
            </h2>
            <p style={{ marginBottom: 12 }}>We use the following third-party services:</p>
            <ul style={{ paddingLeft: 20, listStyleType: 'disc' }} className="flex flex-col gap-2">
              <li><strong>WhatsApp Business API</strong> (Meta) — for message delivery and receipt.</li>
              <li><strong>Razorpay</strong> — for payment processing. We do not store card details.</li>
              <li><strong>Cloud infrastructure</strong> — hosted in Indian data centres for data residency compliance.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              7. Your rights
            </h2>
            <p style={{ marginBottom: 12 }}>Under DPDP and applicable law, you have the right to:</p>
            <ul style={{ paddingLeft: 20, listStyleType: 'disc' }} className="flex flex-col gap-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request erasure of your data (subject to legal retention requirements).</li>
              <li>Withdraw consent at any time.</li>
              <li>Lodge a grievance with our Data Protection Officer or the Data Protection Board of India.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              8. Data retention
            </h2>
            <p>
              We retain doctor account data for as long as the account is active plus 12 months after deletion. Patient message data is retained per the doctor&apos;s configured retention policy (default: 12 months). Aggregated, anonymised analytics data may be retained indefinitely.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
              9. Contact us
            </h2>
            <p>
              For privacy-related queries, data access requests, or grievances:
            </p>
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
              <div>Data Protection Officer</div>
              <div>Yesinfosolutions</div>
              <div style={{ color: 'var(--accent)' }}>privacy@drcliniq.in</div>
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
