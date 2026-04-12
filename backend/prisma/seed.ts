import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const doctor = await prisma.doctor.upsert({
    where: { email: 'doctor@docassist.com' },
    update: {},
    create: {
      email: 'doctor@docassist.com',
      name: 'Dr. Priya Sharma',
      specialty: 'General Physician',
      clinicName: 'Sharma Clinic',
      phone: '+91 98765 43210',
    },
  })

  console.log('Seeded doctor:', doctor.id)

  // Seed sample protocols
  const protocols = [
    {
      title: 'Fever & Cold',
      keywords: ['fever', 'bukhar', 'cold', 'cough', 'khansi', 'temperature'],
      replyText:
        'For fever: Rest well, stay hydrated. Take Paracetamol 500mg if temp > 99°F. Visit clinic if no relief in 48 hours or temp > 103°F.',
      addToMenu: true,
    },
    {
      title: 'Clinic Timings',
      keywords: ['timing', 'time', 'open', 'close', 'hours', 'समय', 'kab'],
      replyText:
        'Sharma Clinic timings: Mon–Sat 9am–1pm and 5pm–8pm. Sunday: 9am–12pm only. For emergencies call: +91 98765 43210.',
      addToMenu: true,
    },
    {
      title: 'Stomach & Vomiting',
      keywords: ['vomit', 'ulti', 'stomach', 'loose motion', 'diarrhea', 'pet dard'],
      replyText:
        'For vomiting/loose motion: Stay hydrated with ORS. Avoid solid food for 4–6 hrs. Take ORS every 30 mins. Visit if symptoms persist beyond 24 hours.',
      addToMenu: true,
    },
  ]

  for (const p of protocols) {
    await prisma.protocol.create({
      data: { ...p, doctorId: doctor.id },
    })
  }

  console.log('Seeded protocols')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
