/**
 * Render a sample welcome card to /tmp/welcome-preview.png — for design iteration.
 *
 * Usage:
 *   npx tsx src/scripts/preview-welcome-card.ts
 *   npx tsx src/scripts/preview-welcome-card.ts "Rajesh Sharma" "MBBS, MD" "Sharma Clinic" "Lucknow" "DC-CARE-4821"
 */
import fs from 'fs'
import path from 'path'
import { renderWelcomeCard } from '../lib/imageCard'

async function main() {
  const [name, specialty, clinic, city, code] = process.argv.slice(2)

  const buffer = await renderWelcomeCard({
    name: name || 'Rajesh Sharma',
    specialty: specialty || 'MBBS, MD — General Physician',
    clinicName: clinic || 'Sharma Clinic, Indira Nagar',
    city: city || 'Lucknow',
    doctorCode: code || 'DC-CARE-4821',
  })

  const out = path.join('/tmp', 'welcome-preview.png')
  fs.writeFileSync(out, buffer)
  console.log(`✅ Rendered ${buffer.length} bytes → ${out}`)
  console.log(`   open ${out}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
