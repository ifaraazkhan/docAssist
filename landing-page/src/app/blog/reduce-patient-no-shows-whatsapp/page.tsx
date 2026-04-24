'use client';

import BlogPostLayout from '@/components/BlogPostLayout';

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 'var(--fs-h3)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.3 }}>
      {children}
    </h2>
  );
}

export default function Post() {
  return (
    <BlogPostLayout
      tag="Growth"
      date="21 Apr 2026"
      readTime="5 min read"
      title={<>How to Reduce Patient No-Shows by 40% Using WhatsApp Reminders</>}
    >
      <p>
        Patient no-shows are the silent revenue killer for Indian clinics. A typical solo-practice doctor with 30 appointments/day sees 4-6 no-shows daily. That&apos;s <strong>₹2,000–5,000 lost per day</strong> — or ₹5-15 lakh per year in wasted slots that could have gone to other patients.
      </p>

      <p>
        Phone call reminders don&apos;t work (patients don&apos;t pick up). SMS has 8% open rates. But <strong>WhatsApp messages have 95%+ open rates in India</strong> — and automated WhatsApp reminders are cutting no-show rates by 40% or more.
      </p>

      <H2>Why patients don&apos;t show up</H2>

      <p>Before solving the problem, understand it. Indian patients miss appointments for 5 main reasons:</p>

      <ol style={{ paddingLeft: 20, listStyleType: 'decimal' }} className="flex flex-col gap-3">
        <li><strong>They forgot</strong> — The #1 reason. Appointments booked days or weeks ago simply slip from memory. No reminder = no show.</li>
        <li><strong>They felt better</strong> — Symptoms improved, so they decided the visit wasn&apos;t necessary. A follow-up message could have converted this to a telecheck or rescheduled for a later date.</li>
        <li><strong>Scheduling conflict</strong> — Something came up, but they didn&apos;t bother calling to cancel or reschedule because it felt awkward or they couldn&apos;t get through on the clinic phone.</li>
        <li><strong>Cost concerns</strong> — They&apos;re worried about the consultation fee but don&apos;t want to ask directly. A message confirming the fee upfront removes this anxiety.</li>
        <li><strong>Transportation/logistics</strong> — They forgot the clinic address, couldn&apos;t find parking, or the timing didn&apos;t work out. A reminder with address + map link helps.</li>
      </ol>

      <H2>The 3-message reminder system</H2>

      <p>
        The most effective WhatsApp reminder system for Indian clinics uses <strong>3 timed messages</strong>:
      </p>

      <div className="flex flex-col gap-4">
        {[
          {
            time: '24 hours before',
            title: 'Confirmation message',
            msg: 'Hi Priya, this is a reminder for your appointment with Dr. Sharma tomorrow (Friday) at 10:30 AM.\n\n📍 Sharma Clinic, MG Road, Lucknow\n⏰ Please arrive 10 minutes early\n\nReply CONFIRM to confirm or RESCHEDULE to change your slot.',
          },
          {
            time: '2 hours before',
            title: 'Preparation reminder',
            msg: 'Hi Priya, your appointment with Dr. Sharma is in 2 hours (10:30 AM today).\n\n📋 Please bring: Previous prescriptions, recent lab reports\n🚗 Parking available at basement level\n\nSee you soon!',
          },
          {
            time: '30 min after missed slot',
            title: 'No-show follow-up',
            msg: 'Hi Priya, we noticed you couldn\'t make your 10:30 AM appointment today. No worries!\n\nWould you like to reschedule? Reply with your preferred date and time, and we\'ll book a new slot for you.',
          },
        ].map(m => (
          <div key={m.time} style={{ padding: 20, borderRadius: 8, border: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', padding: '2px 8px', borderRadius: 4, background: 'var(--accent-soft)' }}>
                {m.time}
              </span>
              <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{m.title}</span>
            </div>
            <div className="mono" style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink-2)', whiteSpace: 'pre-line', letterSpacing: '0.01em' }}>
              {m.msg}
            </div>
          </div>
        ))}
      </div>

      <H2>Why this works better than calls or SMS</H2>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, lineHeight: 1.6 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--rule)' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--ink)', fontWeight: 600 }}>Channel</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--ink)', fontWeight: 600 }}>Open rate</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--ink)', fontWeight: 600 }}>Response rate</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--ink)', fontWeight: 600 }}>Cost/msg</th>
            </tr>
          </thead>
          <tbody style={{ color: 'var(--ink-2)' }}>
            {[
              ['Phone call', '30-40%', 'High (if answered)', '₹2-3 + staff time'],
              ['SMS', '8-12%', '< 2%', '₹0.15-0.25'],
              ['WhatsApp', '95%+', '35-45%', '₹0.50-0.80'],
              ['Email', '15-20%', '3-5%', '₹0.02'],
            ].map(([ch, open, resp, cost]) => (
              <tr key={ch} style={{ borderBottom: '1px solid var(--rule-2)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--ink)' }}>{ch}</td>
                <td style={{ padding: '10px 12px' }}>{open}</td>
                <td style={{ padding: '10px 12px' }}>{resp}</td>
                <td style={{ padding: '10px 12px' }}>{cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        WhatsApp wins because it&apos;s where Indian patients already are. They check WhatsApp 50+ times a day. A reminder there is impossible to miss.
      </p>

      <H2>The ROI math</H2>

      <p>Let&apos;s do the numbers for a typical Indian clinic:</p>

      <div style={{ padding: 24, borderRadius: 8, border: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
        <div className="mono flex flex-col gap-2" style={{ fontSize: 14, lineHeight: 1.8, letterSpacing: '0.02em' }}>
          <div>Appointments per day: <strong>30</strong></div>
          <div>Average no-show rate: <strong>15% (4.5 patients/day)</strong></div>
          <div>Revenue per consultation: <strong>₹500</strong></div>
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 8, marginTop: 4 }}>
            Daily lost revenue: <strong style={{ color: 'var(--crimson)' }}>₹2,250</strong>
          </div>
          <div>Monthly lost revenue: <strong style={{ color: 'var(--crimson)' }}>₹58,500</strong></div>
          <div>Annual lost revenue: <strong style={{ color: 'var(--crimson)' }}>₹7,02,000</strong></div>
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 8, marginTop: 4 }}>
            With 40% no-show reduction: <strong style={{ color: 'var(--accent)' }}>₹2,80,800 saved/year</strong>
          </div>
          <div>Cost of WhatsApp reminders: <strong>₹2,000-4,000/month</strong></div>
          <div>Net savings: <strong style={{ color: 'var(--accent)' }}>₹2,32,800/year</strong></div>
        </div>
      </div>

      <H2>Advanced tactics that boost results</H2>

      <ul style={{ paddingLeft: 20, listStyleType: 'disc' }} className="flex flex-col gap-3">
        <li><strong>Include a reschedule option</strong> — Don&apos;t just remind. Give patients a one-tap way to reschedule. A rescheduled appointment is better than a no-show.</li>
        <li><strong>Send in the patient&apos;s language</strong> — If the patient messages in Hindi, send reminders in Hindi. Language matching increases response rates by 25%.</li>
        <li><strong>Waitlist auto-fill</strong> — When a patient cancels, automatically offer the slot to the next patient on the waitlist. Zero revenue lost.</li>
        <li><strong>Post-visit follow-up</strong> — After the appointment, send a &quot;How are you feeling?&quot; message. Builds loyalty and catches complications early.</li>
        <li><strong>Collect feedback</strong> — A simple &quot;Rate your visit 1-5&quot; message after the appointment. High-rating patients can be prompted for Google reviews.</li>
      </ul>

      <H2>Getting started</H2>

      <p>
        You don&apos;t need to build this from scratch. Tools like DrCliniq integrate appointment booking with automated WhatsApp reminders — the 3-message system runs automatically once a patient books a slot. The doctor sets the protocols once, and every patient gets timely, personalised reminders.
      </p>

      <p>
        The clinics that solve no-shows aren&apos;t working harder. They&apos;re just reminding smarter — on the channel their patients actually read.
      </p>
    </BlogPostLayout>
  );
}
