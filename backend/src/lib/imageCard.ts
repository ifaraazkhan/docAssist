import sharp from 'sharp'
import QRCode from 'qrcode'
import path from 'path'
import fs from 'fs'

export interface DoctorCardInput {
  name: string
  specialty?: string | null
  clinicName?: string | null
  clinicAddress?: string | null
  city?: string | null
  doctorCode: string
}

const TEMPLATE_PATH = path.join(__dirname, '../../assets/cards/welcome-v3.png')

const WIDTH = 1080
const HEIGHT = 1080

// Title-case each word: "rahul sharma" → "Rahul Sharma", "ENT specialist" → "Ent Specialist".
// Preserves a leading "Dr." / "Dr " prefix as-is.
function toTitleCase(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => {
      if (/^dr\.?$/i.test(w)) return 'Dr.'
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    })
    .join(' ')
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildWaMeLink(doctorCode: string): string {
  const waPhone = process.env.WHATSAPP_BUSINESS_PHONE || ''
  if (!waPhone) return 'https://drcliniq.in'
  const text = encodeURIComponent(`Hi! Clinic code: ${doctorCode}`)
  return `https://wa.me/${waPhone.replace(/[^0-9]/g, '')}?text=${text}`
}

function shortLink(doctorCode: string): string {
  const num = (process.env.DRCLINIQ_WA_NUMBER || '').replace(/[^0-9]/g, '')
  return num ? `wa.me/${num}` : 'drcliniq.in'
}

// v3 template layout (1080×1080 square, white bg) — calibrated from pixel probe:
//   Logo bbox            x=147..374,  y=26..92
//   Hindi text block     x=153..587,  y=283..498   (baked)
//   QR placeholder box   x=129..470,  y=579..887   (baked rounded rectangle)
//   Location pin         x=195..223,  y=939..977   (baked)
//   www.drcliniq.in      x≈500+,      y≈940..980   (baked, right side)
//
// Dynamic overlays (name, specialty, QR, address) align with these.

const FONT_REGULAR = path.join(__dirname, '../../assets/fonts/DejaVuSans.ttf')
const FONT_BOLD = path.join(__dirname, '../../assets/fonts/DejaVuSans-Bold.ttf')

/**
 * Render a single text label as a PNG buffer using sharp's built-in text engine
 * (Pango) with a bundled font file — works on any container.
 */
async function renderTextImage(
  label: string,
  opts: { font: string; fontfile: string; color: string }
): Promise<Buffer> {
  return sharp({
    text: {
      text: `<span foreground="${opts.color}">${escapeXml(label)}</span>`,
      font: opts.font,
      fontfile: opts.fontfile,
      rgba: true,
      dpi: 72,
    },
  })
    .png()
    .toBuffer()
}

/**
 * Build all text overlays as individual sharp composite inputs.
 * Each text label is rendered via Pango (sharp's text engine) so
 * it works even on containers without system fonts installed.
 */
async function buildTextOverlays(doc: DoctorCardInput): Promise<sharp.OverlayOptions[]> {
  const rawName = toTitleCase(doc.name)
  const drName = rawName.startsWith('Dr.') || rawName.startsWith('Dr ') ? rawName : `Dr. ${rawName}`
  const specialty = doc.specialty ? toTitleCase(doc.specialty) : ''

  const addressParts = [doc.clinicAddress, doc.city]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map((v) => toTitleCase(v))
  const addressLine = addressParts.join(', ')

  const overlays: sharp.OverlayOptions[] = []

  // Doctor name — large bold
  const nameImg = await renderTextImage(drName, {
    font: 'DejaVu Sans Bold 44', fontfile: FONT_BOLD, color: '#1a2332',
  })
  overlays.push({ input: nameImg, top: 160, left: 147 })

  // Specialty — medium, teal
  if (specialty) {
    const specImg = await renderTextImage(specialty, {
      font: 'DejaVu Sans Bold 24', fontfile: FONT_BOLD, color: '#0d9488',
    })
    overlays.push({ input: specImg, top: 225, left: 147 })
  }

  // Address — smaller
  if (addressLine) {
    const addrImg = await renderTextImage(addressLine, {
      font: 'DejaVu Sans 18', fontfile: FONT_REGULAR, color: '#555555',
    })
    overlays.push({ input: addrImg, top: 950, left: 240 })
  }

  return overlays
}

// QR fits inside the baked placeholder box (x=129..470, y=579..887 → 341×308).
// Centered horizontally, top-aligned with small inset.
const QR_SIZE = 280
const QR_LEFT = 160
const QR_TOP  = 593

export async function renderWelcomeCard(doc: DoctorCardInput): Promise<Buffer> {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Welcome card template not found at ${TEMPLATE_PATH}`)
  }

  const waLink = buildWaMeLink(doc.doctorCode)

  // QR: black on white, high error correction so center logo doesn't break it.
  const qrBuffer = await QRCode.toBuffer(waLink, {
    type: 'png',
    width: QR_SIZE,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#ffffff' },
  })

  // WhatsApp icon overlay for QR center: white rounded square + green WhatsApp glyph.
  const ICON = Math.round(QR_SIZE * 0.22)
  const ICON_LEFT = QR_LEFT + Math.round((QR_SIZE - ICON) / 2)
  const ICON_TOP  = QR_TOP  + Math.round((QR_SIZE - ICON) / 2)
  const waIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${ICON}" height="${ICON}" viewBox="0 0 64 64">
  <rect x="0" y="0" width="64" height="64" rx="12" ry="12" fill="#ffffff"/>
  <circle cx="32" cy="32" r="22" fill="#25D366"/>
  <path fill="#ffffff" d="M32 18.5c-7.4 0-13.4 6-13.4 13.4 0 2.4.6 4.6 1.7 6.6L18.5 45l6.7-1.7c1.9 1 4.1 1.6 6.4 1.6h.4c7.4 0 13.4-6 13.4-13.4S39.4 18.5 32 18.5zm7.8 19.1c-.3.9-1.7 1.7-2.5 1.8-.6.1-1.4.1-2.3-.1-.5-.2-1.2-.4-2.1-.8-3.7-1.6-6.1-5.3-6.3-5.6-.2-.2-1.5-2-1.5-3.8s.9-2.7 1.3-3.1c.3-.4.7-.5 1-.5h.7c.2 0 .5 0 .8.6.3.7.9 2.4 1 2.6.1.2.1.4 0 .6-.1.2-.2.4-.4.6l-.5.6c-.2.2-.4.4-.2.7.2.4.9 1.5 2 2.5 1.4 1.2 2.5 1.6 2.9 1.8.3.2.5.1.7-.1.2-.2.8-.9 1-1.3.2-.3.4-.3.7-.2.3.1 1.9.9 2.3 1.1.4.2.6.3.7.4.1.3.1.9-.2 1.7z"/>
</svg>`.trim()
  const iconBuffer = await sharp(Buffer.from(waIconSvg)).png().toBuffer()

  const textOverlays = await buildTextOverlays(doc)

  const out = await sharp(TEMPLATE_PATH)
    .resize(WIDTH, HEIGHT, { fit: 'fill' })
    .composite([
      ...textOverlays,
      { input: qrBuffer, top: QR_TOP, left: QR_LEFT },
      { input: iconBuffer, top: ICON_TOP, left: ICON_LEFT },
    ])
    .png({ quality: 92, compressionLevel: 9 })
    .toBuffer()

  return out
}

// v3 is already square — no crop needed
export async function renderSquareWelcomeCard(doc: DoctorCardInput): Promise<Buffer> {
  return renderWelcomeCard(doc)
}
