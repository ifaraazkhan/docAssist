import sharp from 'sharp'
import QRCode from 'qrcode'
import path from 'path'
import fs from 'fs'

export interface DoctorCardInput {
  name: string
  specialty?: string | null
  clinicName?: string | null
  city?: string | null
  doctorCode: string
}

const TEMPLATE_PATH = path.join(__dirname, '../../assets/cards/welcome-v2.png')

const WIDTH = 1080
const HEIGHT = 1920

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildWaMeLink(doctorCode: string): string {
  const num = (process.env.DRCLINIQ_WA_NUMBER || '').replace(/[^0-9]/g, '')
  const text = encodeURIComponent(`Hi DrCliniq, I want to book with ${doctorCode}`)
  return num ? `https://wa.me/${num}?text=${text}` : `https://drcliniq.in`
}

function shortLink(doctorCode: string): string {
  const num = (process.env.DRCLINIQ_WA_NUMBER || '').replace(/[^0-9]/g, '')
  return num ? `wa.me/${num}` : 'drcliniq.in'
}

function buildTextOverlaySvg(doc: DoctorCardInput): string {
  const drName = escapeXml(doc.name.startsWith('Dr.') || doc.name.startsWith('Dr ') ? doc.name : `Dr. ${doc.name}`)
  const specialty = doc.specialty ? escapeXml(doc.specialty) : ''
  const clinicLine = [doc.clinicName, doc.city]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .map(escapeXml)
    .join(', ')

  // Layout (template welcome-v2: "Welcome" cursive at y=0..220, big empty teal
  // y=220..1500, white strip y=1500..1920 with "Powered by DrCliniq" baked at ~y=1880)
  //
  // y=330  → "JUST JOINED" celebration ribbon
  // y=470  → doctor name (big)
  // y=580  → specialty
  // y=660  → clinic line
  // y=800  → "IS NOW LIVE ON DRCLINIQ" gold accent
  // y=920  → tagline 1 (bold, 2 lines)
  // y=1080 → Hindi tagline
  // y=1170 → 5-star row
  // y=1280 → "Scan QR below" prompt
  // y=1330 → down arrow
  // y=1430 → "no app needed" reassurance
  // White strip 1500–1880 (Powered-by ribbon takes 1880..1920): QR + link + code
  return `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ribbonGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <filter id="textShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.25"/>
    </filter>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <style>
    .ribbon-text { font: 800 38px sans-serif; fill: #1a1a1a; letter-spacing: 4px; }
    .name { font: 800 96px sans-serif; fill: #ffffff; }
    .specialty { font: 600 42px sans-serif; fill: #fef3c7; }
    .clinic { font: 500 38px sans-serif; fill: #d2ebe1; }
    .live-text { font: 700 44px sans-serif; fill: #fbbf24; letter-spacing: 2px; }
    .tagline-1 { font: 700 54px sans-serif; fill: #ffffff; }
    .tagline-2 { font: 500 36px sans-serif; fill: #e8f5f1; font-style: italic; }
    .scan-prompt { font: 700 38px sans-serif; fill: #ffffff; }
    .scan-arrow { font: 600 36px sans-serif; fill: #fbbf24; }
    .link { font: 700 40px monospace; fill: #0d9488; }
    .code { font: 600 28px sans-serif; fill: #444; letter-spacing: 1px; }
    .sparkle { font: 700 60px sans-serif; fill: #fbbf24; }
  </style>

  <!-- 🎉 "JUST JOINED" gold ribbon banner -->
  <g transform="translate(${WIDTH / 2}, 330)">
    <path d="M -340,-45 L -360,0 L -340,45 L 340,45 L 360,0 L 340,-45 Z"
          fill="url(#ribbonGrad)" filter="url(#textShadow)"/>
    <text x="0" y="14" text-anchor="middle" class="ribbon-text">★  JUST JOINED  ★</text>
  </g>

  <!-- Sparkles flanking the doctor name -->
  <text x="120" y="490" text-anchor="middle" class="sparkle" filter="url(#softGlow)">✦</text>
  <text x="${WIDTH - 120}" y="490" text-anchor="middle" class="sparkle" filter="url(#softGlow)">✦</text>

  <!-- Doctor name (big, with shadow) -->
  <text x="${WIDTH / 2}" y="490" text-anchor="middle" class="name" filter="url(#textShadow)">${drName}</text>

  ${specialty ? `<text x="${WIDTH / 2}" y="580" text-anchor="middle" class="specialty">${specialty}</text>` : ''}

  ${clinicLine ? `<text x="${WIDTH / 2}" y="${specialty ? 650 : 580}" text-anchor="middle" class="clinic">${clinicLine}</text>` : ''}

  <!-- "IS NOW LIVE ON DRCLINIQ" gold accent -->
  <text x="${WIDTH / 2}" y="800" text-anchor="middle" class="live-text">— IS NOW LIVE ON DRCLINIQ —</text>

  <!-- Tagline block -->
  <text x="${WIDTH / 2}" y="910" text-anchor="middle" class="tagline-1">Book your appointment</text>
  <text x="${WIDTH / 2}" y="975" text-anchor="middle" class="tagline-1">in just one WhatsApp!</text>
  <text x="${WIDTH / 2}" y="1055" text-anchor="middle" class="tagline-2">"Bas ek WhatsApp — appointment confirm!"</text>

  <!-- 5-star row (SVG paths) -->
  <g transform="translate(${WIDTH / 2}, 1140)" fill="#fbbf24">
    ${[-200, -100, 0, 100, 200].map(x => `
    <path transform="translate(${x},0)" d="M0,-26 L7,-8 L26,-8 L11,4 L17,22 L0,11 L-17,22 L-11,4 L-26,-8 L-7,-8 Z"/>
    `).join('')}
  </g>

  <!-- Scan QR prompt -->
  <text x="${WIDTH / 2}" y="1260" text-anchor="middle" class="scan-prompt">Scan the QR below</text>

  <!-- Down-arrow path -->
  <g transform="translate(${WIDTH / 2}, 1305)" fill="#fbbf24">
    <path d="M -22,0 L 22,0 L 22,18 L 36,18 L 0,52 L -36,18 L -22,18 Z"/>
  </g>

  <text x="${WIDTH / 2}" y="1420" text-anchor="middle" class="scan-arrow">no app needed • direct on WhatsApp</text>

  <!-- White strip starts ~y=1460; "Powered by DrCliniq" baked at ~y=1880.
       QR top=1470, size=260 → ends ~1730. Link/code between QR and powered-by. -->
  <text x="${WIDTH / 2}" y="1760" text-anchor="middle" class="link">${escapeXml(shortLink(doc.doctorCode))}</text>
  <text x="${WIDTH / 2}" y="1800" text-anchor="middle" class="code">CODE: ${escapeXml(doc.doctorCode)}</text>
</svg>
`.trim()
}

export async function renderWelcomeCard(doc: DoctorCardInput): Promise<Buffer> {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Welcome card template not found at ${TEMPLATE_PATH}`)
  }

  // 1. Generate QR code as PNG buffer (dark teal on white, fits cleanly in bottom strip)
  const waLink = buildWaMeLink(doc.doctorCode)
  const QR_SIZE = 260
  const qrBuffer = await QRCode.toBuffer(waLink, {
    type: 'png',
    width: QR_SIZE,
    margin: 1,
    color: { dark: '#0d9488', light: '#ffffff' },
  })

  // 2. Build text overlay SVG
  const textSvg = buildTextOverlaySvg(doc)

  // 3. Composite text + QR onto template
  const out = await sharp(TEMPLATE_PATH)
    .resize(WIDTH, HEIGHT, { fit: 'cover' })
    .composite([
      { input: Buffer.from(textSvg), top: 0, left: 0 },
      { input: qrBuffer, top: 1455, left: Math.round((WIDTH - QR_SIZE) / 2) },
    ])
    .png({ quality: 92, compressionLevel: 9 })
    .toBuffer()

  return out
}

export async function renderSquareWelcomeCard(doc: DoctorCardInput): Promise<Buffer> {
  // Centre-crop the vertical card down to 1080x1080 for IG feed / WhatsApp chat image
  const vertical = await renderWelcomeCard(doc)
  return sharp(vertical)
    .extract({ left: 0, top: Math.round((HEIGHT - WIDTH) / 2), width: WIDTH, height: WIDTH })
    .png()
    .toBuffer()
}
