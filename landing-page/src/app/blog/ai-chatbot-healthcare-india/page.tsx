'use client';

import BlogPostLayout from '@/components/BlogPostLayout';

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.3 }}>
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>
      {children}
    </h3>
  );
}

export default function Post() {
  return (
    <BlogPostLayout
      tag="AI & LLM"
      date="23 Apr 2026"
      readTime="7 min read"
      title={<>AI Chatbots in Indian Healthcare: What Actually Works in 2026</>}
    >
      <p>
        Every month, a new &quot;AI healthcare chatbot&quot; launches in India. Most fail within 6 months. Not because the technology is bad — but because they solve the wrong problem in the wrong way.
      </p>

      <p>
        Here&apos;s what the market has learned, painfully, about <strong>AI chatbots in Indian healthcare</strong> — and why the model that actually works looks nothing like a traditional chatbot.
      </p>

      <H2>Why generic healthcare chatbots fail in India</H2>

      <H3>1. Wrong channel</H3>
      <p>
        Most healthcare chatbot startups build apps or web widgets. The problem? Indian patients don&apos;t download clinic apps. They use WhatsApp. A chatbot that lives inside a custom app has a 5% adoption rate. The same chatbot on WhatsApp gets 95%+ engagement — because patients are already there.
      </p>

      <H3>2. Wrong language model</H3>
      <p>
        Indian patients don&apos;t write in clean English. A real message looks like: <em>&quot;Doctor sahab mere bache ko kal raat se 102 fever hai kya paracetamol de sakte hain?&quot;</em> — That&apos;s Hinglish with medical terms, Hindi grammar, and English numbers. Basic NLP models trained on English medical text can&apos;t parse this. You need <strong>LLMs (Large Language Models)</strong> that understand multilingual, code-switched Indian text.
      </p>

      <H3>3. Wrong interaction model</H3>
      <p>
        Traditional chatbots use decision trees: &quot;Press 1 for appointments, 2 for prescriptions.&quot; Patients hate this. They want to type naturally and get a natural answer. An LLM-powered system understands free-form text and maps it to the right response — no menus, no buttons, no friction.
      </p>

      <H3>4. No doctor control</H3>
      <p>
        Generic AI chatbots generate their own medical responses using general training data. This is dangerous and legally problematic. Indian doctors don&apos;t trust AI that writes its own medical advice. What works is <strong>protocol-based AI</strong> — where the doctor writes the medical content, and the AI only handles matching and delivery.
      </p>

      <H2>The model that works: protocol-based LLM assistants</H2>

      <p>
        The AI healthcare tools gaining traction in India in 2026 share these characteristics:
      </p>

      <ul style={{ paddingLeft: 20, listStyleType: 'disc' }} className="flex flex-col gap-3">
        <li><strong>WhatsApp-native</strong> — Lives where patients already are. Zero download, zero onboarding for patients.</li>
        <li><strong>LLM-powered understanding</strong> — Uses large language models to understand Hindi, Hinglish, English, and regional language messages. Not keyword matching — genuine language understanding.</li>
        <li><strong>Doctor-authored protocols</strong> — The AI doesn&apos;t generate medical advice. Doctors create protocols (fever management, post-op care, medication dosage). The AI matches patient queries to the right protocol and delivers the doctor&apos;s own reply.</li>
        <li><strong>Smart triage, not diagnosis</strong> — The AI doesn&apos;t diagnose. It triages. Urgent patterns (chest pain + shortness of breath, very high fever in infants) get flagged to the doctor immediately. Everything else gets an appropriate protocol response.</li>
        <li><strong>Compliance built in</strong> — Every automated reply includes NMC-compliant disclaimers. Data stored in India per DPDP Act.</li>
      </ul>

      <H2>LLM vs. traditional NLP: why it matters for healthcare</H2>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, lineHeight: 1.6 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--rule)' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--ink)', fontWeight: 600 }}>Capability</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--ink)', fontWeight: 600 }}>Traditional NLP bot</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--ink)', fontWeight: 600 }}>LLM-powered assistant</th>
            </tr>
          </thead>
          <tbody style={{ color: 'var(--ink-2)' }}>
            {[
              ['Hindi/Hinglish understanding', '❌ Poor', '✅ Native-level'],
              ['Typos & abbreviations', '❌ Breaks', '✅ Understands context'],
              ['Free-form questions', '❌ Needs menus', '✅ Natural conversation'],
              ['Multiple intents in one message', '❌ Picks first only', '✅ Handles all'],
              ['Medical context understanding', '❌ Keyword only', '✅ Semantic understanding'],
              ['Setup complexity', '✅ Simple rules', '✅ Simple protocols'],
              ['Cost per query', '✅ Very low', '✅ Low (optimised models)'],
            ].map(([cap, old, llm]) => (
              <tr key={cap} style={{ borderBottom: '1px solid var(--rule-2)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--ink)' }}>{cap}</td>
                <td style={{ padding: '10px 12px' }}>{old}</td>
                <td style={{ padding: '10px 12px' }}>{llm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>What to look for in an AI healthcare assistant</H2>

      <p>If you&apos;re evaluating AI chatbot solutions for your clinic, here&apos;s the checklist:</p>

      <ul style={{ paddingLeft: 20, listStyleType: 'disc' }} className="flex flex-col gap-2">
        <li>✅ <strong>WhatsApp Business API integration</strong> — Not unofficial tools that get your number banned</li>
        <li>✅ <strong>Hindi + Hinglish + English support</strong> — Not just English</li>
        <li>✅ <strong>Doctor-controlled protocols</strong> — You write the medical replies, not the AI</li>
        <li>✅ <strong>Urgent case flagging</strong> — AI should escalate, not suppress</li>
        <li>✅ <strong>DPDP compliant</strong> — Data stored in India, proper consent flows</li>
        <li>✅ <strong>NMC-aligned disclaimers</strong> — On every automated reply</li>
        <li>✅ <strong>Appointment booking</strong> — Integrated scheduling, not just messaging</li>
        <li>✅ <strong>Doctor dashboard</strong> — See all conversations, override AI when needed</li>
      </ul>

      <H2>The future: AI as a clinic operating system</H2>

      <p>
        The trajectory is clear. AI healthcare tools in India are evolving from simple chatbots to <strong>clinic operating systems</strong> — handling not just messaging but appointment scheduling, follow-up management, prescription reminders, lab report delivery, and revenue analytics. All through the channel patients already use: WhatsApp.
      </p>

      <p>
        The clinics adopting this in 2026 are the ones that will define how Indian healthcare communication works for the next decade.
      </p>
    </BlogPostLayout>
  );
}
