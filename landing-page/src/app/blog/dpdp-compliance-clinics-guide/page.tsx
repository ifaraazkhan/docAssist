'use client';

import BlogPostLayout from '@/components/BlogPostLayout';

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.3 }}>
      {children}
    </h2>
  );
}

function Callout({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warning' }) {
  return (
    <div style={{
      padding: 20,
      borderRadius: 8,
      border: `1px solid ${type === 'warning' ? 'var(--saffron)' : 'var(--rule)'}`,
      background: type === 'warning' ? 'var(--saffron-soft)' : 'var(--paper-2)',
      lineHeight: 1.7,
      fontSize: 15,
    }}>
      {children}
    </div>
  );
}

export default function Post() {
  return (
    <BlogPostLayout
      tag="Compliance"
      date="22 Apr 2026"
      readTime="6 min read"
      title={<>DPDP Act Compliance for Clinics: What Every Indian Doctor Must Know</>}
    >
      <p>
        The <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> is now fully in effect. If your clinic collects patient phone numbers, sends WhatsApp messages, stores medical records digitally, or uses any software that processes patient data — you are a <strong>data fiduciary</strong> under this law.
      </p>

      <p>
        Most Indian doctors don&apos;t know this yet. But the penalties for non-compliance go up to <strong>₹250 crore</strong>. Here&apos;s what you need to know — in plain language, not legalese.
      </p>

      <H2>What the DPDP Act means for clinics</H2>

      <p>
        In simple terms, the DPDP Act says: <em>if you collect someone&apos;s personal data, you must tell them what you&apos;re doing with it, get their consent, keep it safe, and delete it when you no longer need it.</em>
      </p>

      <p>For clinics, &quot;personal data&quot; includes:</p>

      <ul style={{ paddingLeft: 20, listStyleType: 'disc' }} className="flex flex-col gap-2">
        <li>Patient names, phone numbers, email addresses</li>
        <li>Medical records, prescriptions, lab reports</li>
        <li>WhatsApp conversation history</li>
        <li>Appointment booking data</li>
        <li>Payment and billing records</li>
        <li>Any data collected through clinic software, apps, or websites</li>
      </ul>

      <Callout type="warning">
        <strong>⚠️ Health data is &quot;sensitive personal data&quot;</strong> — it requires higher protection standards. Even storing a patient&apos;s diagnosis in a WhatsApp chat makes you responsible for that data under DPDP.
      </Callout>

      <H2>Key requirements for clinics</H2>

      <div className="flex flex-col gap-6">
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>1. Informed consent</h3>
          <p>
            Before processing patient data, you must obtain <strong>clear, specific consent</strong>. This means telling patients: what data you collect, why you collect it, how long you keep it, and who you share it with. A generic &quot;I agree&quot; checkbox is not sufficient.
          </p>
        </div>

        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>2. Purpose limitation</h3>
          <p>
            You can only use patient data for the purpose it was collected. If a patient gives you their phone number for appointment reminders, you cannot use it for promotional messages without separate consent.
          </p>
        </div>

        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>3. Data minimisation</h3>
          <p>
            Collect only the data you need. If you don&apos;t need a patient&apos;s Aadhaar number for treatment, don&apos;t ask for it. The less data you collect, the less liability you carry.
          </p>
        </div>

        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>4. Data storage in India</h3>
          <p>
            Patient data must be stored on servers within India (with some exceptions for cross-border transfer under government-approved arrangements). If your clinic software stores data on servers outside India, this is a compliance risk.
          </p>
        </div>

        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>5. Right to erasure</h3>
          <p>
            Patients can request deletion of their data. You must comply within a reasonable timeframe, unless retention is required by other laws (like medical record retention rules).
          </p>
        </div>

        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>6. Breach notification</h3>
          <p>
            If patient data is compromised (leaked, hacked, accidentally exposed), you must notify the Data Protection Board of India. There is no &quot;it was just a small breach&quot; exception.
          </p>
        </div>
      </div>

      <H2>WhatsApp communication and DPDP</H2>

      <p>
        This is where most clinics are unknowingly non-compliant. If you use WhatsApp to communicate with patients (and almost every Indian doctor does), here&apos;s what DPDP requires:
      </p>

      <ul style={{ paddingLeft: 20, listStyleType: 'disc' }} className="flex flex-col gap-2">
        <li><strong>Consent for automated messages</strong> — If you use any automation tool (auto-replies, broadcast lists, chatbots), patients must consent to receiving automated communication</li>
        <li><strong>Official API only</strong> — Using unofficial WhatsApp automation tools (those that don&apos;t use the official Business API) puts patient data at risk and violates both WhatsApp&apos;s terms and DPDP</li>
        <li><strong>Chat data storage</strong> — WhatsApp messages containing patient health information are &quot;sensitive personal data&quot;. Your automation tool must store this data in India</li>
        <li><strong>Employee access controls</strong> — Not every staff member should have access to all patient WhatsApp conversations. Role-based access is required</li>
      </ul>

      <H2>Penalties for non-compliance</H2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { penalty: '₹50 Cr', offence: 'Failure to take security measures' },
          { penalty: '₹200 Cr', offence: 'Failure to notify data breach' },
          { penalty: '₹250 Cr', offence: 'Processing children\'s data without consent' },
          { penalty: '₹10,000', offence: 'Per individual complaint upheld' },
        ].map(p => (
          <div key={p.offence} style={{ padding: 20, borderRadius: 8, border: '1px solid var(--rule)', background: 'var(--paper-2)', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--crimson)', letterSpacing: '-0.02em' }}>{p.penalty}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6, letterSpacing: '0.02em', lineHeight: 1.4 }}>{p.offence}</div>
          </div>
        ))}
      </div>

      <H2>DPDP compliance checklist for clinics</H2>

      <div style={{ padding: 24, borderRadius: 8, border: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
        <ul style={{ paddingLeft: 20, listStyleType: 'none' }} className="flex flex-col gap-3">
          {[
            'Patient consent form updated with DPDP-compliant language',
            'Privacy policy published and accessible to patients',
            'WhatsApp automation uses official Business API (not unofficial tools)',
            'Patient data stored on servers within India',
            'Role-based access controls for staff viewing patient data',
            'Data retention policy defined (how long records are kept)',
            'Process for handling patient data deletion requests',
            'Data breach response plan documented',
            'Automated messages include opt-out mechanism',
            'Third-party software vendors verified for DPDP compliance',
          ].map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>☐</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <H2>How compliant tools help</H2>

      <p>
        The easiest path to DPDP compliance for WhatsApp communication is using tools that are <strong>built for Indian healthcare compliance</strong>. Look for:
      </p>

      <ul style={{ paddingLeft: 20, listStyleType: 'disc' }} className="flex flex-col gap-2">
        <li>India-based data storage with encryption at rest and in transit</li>
        <li>Official WhatsApp Business API integration</li>
        <li>Built-in consent collection flows</li>
        <li>Automatic NMC-compliant disclaimers on medical replies</li>
        <li>Audit logs for data access</li>
        <li>One-click data export and deletion for patient requests</li>
      </ul>

      <p>
        DPDP compliance isn&apos;t optional anymore. But with the right tools and processes, it doesn&apos;t have to be complicated. Start with the checklist above, fix the gaps, and make sure any software you use meets these standards.
      </p>
    </BlogPostLayout>
  );
}
