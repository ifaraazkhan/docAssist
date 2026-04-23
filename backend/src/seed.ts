import { query, withTransaction } from './lib/db'
import dotenv from 'dotenv'

dotenv.config()

async function seed() {
  await withTransaction(async (client) => {
    console.log('Seeding database...')

    // ============================================================
    // 1. Demo Doctor
    // ============================================================
    const doctorResult = await client.query(`
      INSERT INTO doctors (phone, email, name, specialty, clinic_name, city, clinic_address,
        clinic_phone, clinic_hours_start, clinic_hours_end, doctor_code, short_link_slug,
        plan, onboarding_complete, onboarding_step, whatsapp_connected)
      VALUES (
        '919876543210', 'doctor@docassist.com', 'Dr. Priya Sharma',
        'General Physician', 'Sharma Clinic', 'Noida',
        'Sector 22, Noida, Uttar Pradesh', '919876543210',
        '09:00', '20:00', 'CLINIC_PS001', 'priya-sharma',
        'pro', true, 'done', true
      )
      ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `)
    const doctorId = doctorResult.rows[0].id
    console.log('Doctor:', doctorId)

    // ============================================================
    // 2. Library Protocols (15 templates across specialties)
    // ============================================================
    const libraryProtocols = [
      // General Physician
      {
        title: 'Adult Fever Management',
        specialty: 'General Physician',
        keywords: ['fever', 'bukhar', 'temperature', 'hot', 'tapman', 'badan garam'],
        reply_text: '🌡️ *Fever Management*\n\n1. Take Paracetamol 500mg (Crocin/Dolo) every 6 hours\n2. Stay hydrated — drink ORS, coconut water, or nimbu paani\n3. Sponge with lukewarm water (NOT cold)\n4. Rest and avoid heavy food\n5. Monitor temperature every 4 hours\n\n⚠️ Visit the clinic immediately if:\n• Fever exceeds 103°F / 39.4°C\n• Persists beyond 3 days\n• Accompanied by rash, stiff neck, or confusion',
        reply_hindi: '🌡️ *बुखार प्रबंधन*\n\n1. हर 6 घंटे में पैरासिटामोल 500mg (क्रोसिन/डोलो) लें\n2. ORS, नारियल पानी या नींबू पानी पीते रहें\n3. गुनगुने पानी से स्पंज करें (ठंडा पानी नहीं)\n4. आराम करें, भारी खाना न खाएं\n5. हर 4 घंटे तापमान जांचें',
        disclaimer: 'Visit the clinic if symptoms persist beyond 48 hours.',
      },
      {
        title: 'Cold & Cough',
        specialty: 'General Physician',
        keywords: ['cold', 'cough', 'sardi', 'khansi', 'sneezing', 'runny nose', 'nazla', 'zukam'],
        reply_text: '🤧 *Cold & Cough Care*\n\n1. Steam inhalation 2-3 times daily\n2. Warm salt water gargle\n3. Drink warm fluids — adrak chai, haldi doodh\n4. Take Cetirizine 10mg at night for sneezing\n5. Honey + tulsi for sore throat\n\n⚠️ Visit the clinic if:\n• Cough persists beyond 7 days\n• Difficulty breathing or wheezing\n• High fever with body ache\n• Yellowish/greenish sputum',
        reply_hindi: null,
        disclaimer: 'Visit the clinic if symptoms persist beyond 7 days.',
      },
      {
        title: 'Diarrhea & Vomiting',
        specialty: 'General Physician',
        keywords: ['diarrhea', 'vomiting', 'loose motion', 'ulti', 'pet kharab', 'dast', 'vomit'],
        reply_text: '💧 *Diarrhea & Vomiting Care*\n\n1. Start ORS immediately — small sips every 5 minutes\n2. Avoid milk, spicy food, and oily items\n3. Eat light — khichdi, curd rice, bananas\n4. Take Zinc 20mg once daily (adults)\n5. Do NOT take antibiotics without prescription\n\n⚠️ Visit the clinic immediately if:\n• Blood in stool or vomit\n• No urine for 6+ hours\n• Severe cramps or dizziness\n• Child under 5 years affected',
        reply_hindi: null,
        disclaimer: 'Visit the clinic if symptoms persist beyond 24 hours.',
      },
      {
        title: 'Headache Relief',
        specialty: 'General Physician',
        keywords: ['headache', 'sir dard', 'migraine', 'head pain', 'sar dard'],
        reply_text: '🧠 *Headache Relief*\n\n1. Take Paracetamol 500mg\n2. Rest in a dark, quiet room\n3. Stay hydrated\n4. Apply balm on forehead and temples\n5. Avoid screen time for 1-2 hours\n\n⚠️ Visit the clinic if:\n• Sudden severe headache (worst of your life)\n• Accompanies fever and stiff neck\n• Vision changes or confusion\n• Recurring headaches (3+ times/week)',
        reply_hindi: null,
        disclaimer: 'Visit the clinic if symptoms persist beyond 48 hours.',
      },
      {
        title: 'BP Review & Hypertension',
        specialty: 'General Physician',
        keywords: ['bp', 'blood pressure', 'hypertension', 'high bp', 'low bp', 'chakkar'],
        reply_text: '❤️ *Blood Pressure Review*\n\n1. Take your BP medication at the same time every day\n2. Reduce salt intake — avoid pickles, papad, processed food\n3. Walk for 30 minutes daily\n4. Check BP at home if you have a monitor\n5. Record readings in a diary\n\n⚠️ Visit immediately if:\n• BP > 180/120 mmHg\n• Chest pain or shortness of breath\n• Sudden vision changes\n• Severe headache with nausea',
        reply_hindi: null,
        disclaimer: 'Do not stop or change BP medications without consulting your doctor.',
      },
      {
        title: 'Diabetes Follow-up',
        specialty: 'General Physician',
        keywords: ['diabetes', 'sugar', 'glucose', 'madhumeh', 'sugar level', 'insulin'],
        reply_text: '🩸 *Diabetes Follow-up*\n\n1. Take medications/insulin as prescribed\n2. Check fasting sugar before breakfast\n3. Diet: avoid white rice, maida, sweets, sugary drinks\n4. Walk 30 minutes after meals\n5. Check feet daily for cuts/sores\n\n📊 Target ranges:\n• Fasting: 80–130 mg/dL\n• Post-meal (2hr): < 180 mg/dL\n• HbA1c: < 7%\n\n⚠️ Visit if sugar < 70 or > 300 mg/dL',
        reply_hindi: null,
        disclaimer: 'Never adjust insulin dosage without medical advice.',
      },
      {
        title: 'Monsoon Disease Prep',
        specialty: 'General Physician',
        keywords: ['monsoon', 'barish', 'dengue', 'malaria', 'typhoid', 'rainy season'],
        reply_text: '🌧️ *Monsoon Health Advisory*\n\n1. Use mosquito repellent and nets\n2. Drink only boiled/filtered water\n3. Avoid street food during rainy season\n4. Keep surroundings dry — no stagnant water\n5. Wash hands frequently\n\n⚠️ Watch for:\n• High fever with body ache → could be Dengue\n• Fever with chills → could be Malaria\n• Fever > 5 days → could be Typhoid\n\nGet tested if any of these symptoms appear.',
        reply_hindi: null,
        disclaimer: 'Seek immediate medical attention for high fever lasting more than 2 days.',
      },
      // Pediatrics
      {
        title: 'Pediatric Fever',
        specialty: 'Pediatrics',
        keywords: ['child fever', 'bachche ko bukhar', 'baby fever', 'infant fever', 'kids fever'],
        reply_text: '👶 *Child Fever Care*\n\n1. Paracetamol drops/syrup as per age/weight\n2. Keep child lightly dressed\n3. Sponge with lukewarm water\n4. Breastfeed/give fluids frequently\n5. Monitor temperature every 2 hours\n\n⚠️ Rush to clinic/hospital if:\n• Age < 3 months with any fever\n• Temperature > 104°F (40°C)\n• Seizure/convulsion (fit)\n• Child is limp, unresponsive, or not feeding\n• Rash that doesn\'t fade when pressed',
        reply_hindi: null,
        disclaimer: 'Children under 3 months with fever need immediate medical evaluation.',
      },
      {
        title: 'Vaccination Schedule',
        specialty: 'Pediatrics',
        keywords: ['vaccine', 'vaccination', 'tika', 'immunization', 'booster', 'injection'],
        reply_text: '💉 *Vaccination Info*\n\nPlease visit the clinic with your child\'s vaccination card.\n\nKey milestones:\n• Birth: BCG, OPV-0, Hep B-1\n• 6 weeks: DPT-1, OPV-1, Hep B-2, Rota-1\n• 10 weeks: DPT-2, OPV-2, Rota-2\n• 14 weeks: DPT-3, OPV-3, Rota-3\n• 9 months: MMR-1, Typhoid\n• 15 months: MMR-2, Varicella\n\n📞 Call the clinic to schedule your child\'s next vaccination.',
        reply_hindi: null,
        disclaimer: 'Vaccination schedules may vary. Consult your pediatrician.',
      },
      // Cardiology
      {
        title: 'Chest Pain Assessment',
        specialty: 'Cardiology',
        keywords: ['chest pain', 'seene mein dard', 'heart pain', 'dil ka dard'],
        reply_text: '🫀 *Chest Pain — Important*\n\n⚠️ If you are currently having chest pain:\n• Call 112 immediately\n• Chew 1 Aspirin 325mg (if not allergic)\n• Sit upright, do not lie flat\n• Do NOT drive yourself\n\nIf chest pain has passed:\n1. Note when it happened and how long it lasted\n2. What were you doing? (exertion, rest, eating)\n3. Did it spread to arm, jaw, or back?\n4. Schedule an urgent clinic visit\n\nDo NOT ignore chest pain. Better safe than sorry.',
        reply_hindi: null,
        disclaimer: 'Chest pain can be a medical emergency. Call 112 if experiencing symptoms now.',
      },
      // Dermatology
      {
        title: 'Skin Rash Assessment',
        specialty: 'Dermatology',
        keywords: ['rash', 'skin', 'itching', 'khujli', 'allergy', 'daad', 'fungal'],
        reply_text: '🩹 *Skin Rash Care*\n\n1. Avoid scratching — it worsens the rash\n2. Apply calamine lotion for relief\n3. Wear loose cotton clothes\n4. Avoid hot water baths\n5. Take Cetirizine 10mg at night for itching\n\n📸 Please send a clear photo of the affected area for assessment.\n\n⚠️ Visit the clinic if:\n• Rash is spreading rapidly\n• Fever with rash\n• Blisters or open sores\n• Swelling of face/lips',
        reply_hindi: null,
        disclaimer: 'Do not apply steroid creams without prescription.',
      },
      // Gynecology
      {
        title: 'Pregnancy Queries',
        specialty: 'Gynecology',
        keywords: ['pregnant', 'pregnancy', 'garbh', 'period late', 'missing period'],
        reply_text: '🤰 *Pregnancy Care*\n\nIf you suspect you might be pregnant:\n1. Take a home pregnancy test (morning urine)\n2. If positive, schedule a clinic visit within 1 week\n3. Start Folic Acid 5mg daily\n4. Avoid raw/undercooked food, papaya, pineapple\n5. No medications without doctor\'s advice\n\n⚠️ Visit immediately if:\n• Bleeding or spotting\n• Severe abdominal pain\n• Dizziness or fainting\n• History of ectopic pregnancy',
        reply_hindi: null,
        disclaimer: 'Early prenatal care is essential. Visit your gynecologist promptly.',
      },
      // Orthopedics
      {
        title: 'Back Pain Management',
        specialty: 'Orthopedics',
        keywords: ['back pain', 'kamar dard', 'spine', 'slip disc', 'sciatica'],
        reply_text: '🦴 *Back Pain Relief*\n\n1. Apply hot pack for 15-20 minutes, 3 times daily\n2. Take Paracetamol 500mg for pain\n3. Avoid bending, lifting heavy objects\n4. Sleep on a firm mattress\n5. Gentle stretching exercises\n\n⚠️ Visit the clinic urgently if:\n• Pain radiates down the leg (sciatica)\n• Numbness or tingling in legs\n• Difficulty controlling bladder/bowel\n• Pain after a fall or injury\n• Pain worsening despite rest',
        reply_hindi: null,
        disclaimer: 'Do not take muscle relaxants without prescription.',
      },
      // ENT
      {
        title: 'Ear Pain & Infection',
        specialty: 'ENT',
        keywords: ['ear pain', 'kaan dard', 'ear infection', 'hearing'],
        reply_text: '👂 *Ear Pain Care*\n\n1. Take Paracetamol for pain relief\n2. Do NOT insert anything into the ear\n3. Keep the ear dry — no swimming\n4. Apply warm compress on the outer ear\n5. Do NOT use ear drops without prescription\n\n⚠️ Visit the clinic if:\n• Discharge from the ear\n• Sudden hearing loss\n• Ear pain with fever\n• Pain after swimming or injury\n• Ringing in the ear (tinnitus)',
        reply_hindi: null,
        disclaimer: 'Do not self-medicate with ear drops. See an ENT specialist.',
      },
      // General — Prescription Refill
      {
        title: 'Prescription Refill Request',
        specialty: 'General Physician',
        keywords: ['refill', 'medicine', 'dawai', 'prescription', 'tablet khatam', 'repeat'],
        reply_text: '💊 *Prescription Refill*\n\nTo request a prescription refill:\n1. Send a photo of your current prescription/medicine strip\n2. Mention which medicines you need\n3. The doctor will review and respond\n\n⏱️ Refill requests are usually processed within 4-6 hours during clinic hours.\n\n⚠️ Note:\n• New symptoms require a clinic visit\n• Controlled substances cannot be refilled via WhatsApp\n• Prescriptions older than 6 months need a fresh consultation',
        reply_hindi: null,
        disclaimer: 'Prescription refills are at the doctor\'s discretion after review.',
      },
    ]

    for (const lp of libraryProtocols) {
      await client.query(`
        INSERT INTO library_protocols (title, specialty, keywords, reply_text, reply_hindi, disclaimer)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [lp.title, lp.specialty, lp.keywords, lp.reply_text, lp.reply_hindi, lp.disclaimer])
    }
    console.log(`Library protocols: ${libraryProtocols.length}`)

    // ============================================================
    // 3. Doctor's Protocols (1 system + 2 library + 1 custom)
    // ============================================================

    // System protocol: Clinic Details
    await client.query(`
      INSERT INTO protocols (doctor_id, title, keywords, reply_text, is_active, add_to_menu, protocol_type, disclaimer)
      VALUES ($1, 'Clinic Details', $2,
        '🏥 *Sharma Clinic*\nSector 22, Noida, Uttar Pradesh\n\n👨‍⚕️ Dr. Priya Sharma — General Physician\n\n📅 Monday – Saturday\n🕐 Morning: 9:00 AM – 1:00 PM\n🕐 Evening: 5:00 PM – 8:00 PM\n\n📞 Phone: +91 98765 43210\n\nPlease book an appointment to avoid waiting.',
        true, true, 'system', '')
    `, [doctorId, ['timing', 'time', 'open', 'close', 'hours', 'kab', 'schedule', 'clinic', 'address']])

    // Get library IDs for cloning
    const feverLib = await client.query(
      `SELECT id FROM library_protocols WHERE title = 'Adult Fever Management' LIMIT 1`
    )
    const coldLib = await client.query(
      `SELECT id FROM library_protocols WHERE title = 'Cold & Cough' LIMIT 1`
    )

    // Library clone: Fever
    if (feverLib.rows[0]) {
      await client.query(`
        INSERT INTO protocols (doctor_id, library_source_id, title, keywords, reply_text, is_active, add_to_menu, protocol_type, usage_count, disclaimer)
        SELECT $1, id, title, keywords, reply_text, true, true, 'library', 142, disclaimer
        FROM library_protocols WHERE id = $2
      `, [doctorId, feverLib.rows[0].id])
    }

    // Library clone: Cold & Cough
    if (coldLib.rows[0]) {
      await client.query(`
        INSERT INTO protocols (doctor_id, library_source_id, title, keywords, reply_text, is_active, add_to_menu, protocol_type, usage_count, disclaimer)
        SELECT $1, id, title, keywords, reply_text, true, true, 'library', 76, disclaimer
        FROM library_protocols WHERE id = $2
      `, [doctorId, coldLib.rows[0].id])
    }

    // Custom protocol
    await client.query(`
      INSERT INTO protocols (doctor_id, title, keywords, reply_text, is_active, add_to_menu, protocol_type, usage_count, disclaimer)
      VALUES ($1, 'Stomach & Vomiting', $2,
        '💧 *Stomach & Vomiting Care*\n\nFor vomiting/loose motion:\n1. Stay hydrated with ORS\n2. Avoid solid food for 4–6 hrs\n3. Take ORS every 30 mins\n4. Visit if symptoms persist beyond 24 hours.',
        true, true, 'custom', 98,
        'Visit the clinic if symptoms persist beyond 24 hours.')
    `, [doctorId, ['vomit', 'ulti', 'stomach', 'loose motion', 'diarrhea', 'pet dard']])

    console.log('Doctor protocols: 4 (1 system + 2 library + 1 custom)')

    // ============================================================
    // 4. Sample Patients + Mappings
    // ============================================================
    const patients = [
      { phone: '919988776655', name: 'Rajesh Kumar' },
      { phone: '918877665544', name: 'Anita Verma' },
      { phone: '917766554433', name: 'Mohammed Faisal' },
    ]

    for (const p of patients) {
      const patResult = await client.query(`
        INSERT INTO patients (phone, name)
        VALUES ($1, $2)
        ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [p.phone, p.name])

      await client.query(`
        INSERT INTO patient_doctor_mappings (patient_id, doctor_id, source, patient_type, is_urgent, unread_count)
        VALUES ($1, $2, 'CLINIC_PS001', $3, $4, $5)
        ON CONFLICT (patient_id, doctor_id) DO NOTHING
      `, [
        patResult.rows[0].id,
        doctorId,
        p.phone === '919988776655' ? 'returning' : 'new',
        p.phone === '919988776655',  // Rajesh is urgent
        p.phone === '919988776655' ? 3 : 0,
      ])
    }
    console.log('Patients: 3 with mappings')

    // ============================================================
    // 5. Sample Messages
    // ============================================================
    const rajesh = await client.query(`SELECT id FROM patients WHERE phone = '919988776655'`)
    const rajeshId = rajesh.rows[0]?.id

    if (rajeshId) {
      const feverProto = await client.query(
        `SELECT id FROM protocols WHERE doctor_id = $1 AND title = 'Adult Fever Management' AND deleted_at IS NULL LIMIT 1`,
        [doctorId]
      )

      const sampleMessages = [
        {
          patient_phone: '919988776655',
          direction: 'inbound',
          sender: 'patient',
          content: 'Doctor sahab, mujhe 2 din se bukhar aa raha hai',
          msg_type: 'text',
          protocol_id: null,
          minutes_ago: 120,
        },
        {
          patient_phone: '919988776655',
          direction: 'outbound',
          sender: 'bot',
          content: '🌡️ *Fever Management*\n\n1. Take Paracetamol 500mg every 6 hours\n2. Stay hydrated...',
          msg_type: 'text',
          protocol_id: feverProto.rows[0]?.id ?? null,
          minutes_ago: 119,
        },
        {
          patient_phone: '919988776655',
          direction: 'inbound',
          sender: 'patient',
          content: 'Thank you doctor, temperature abhi 102 hai',
          msg_type: 'text',
          protocol_id: null,
          minutes_ago: 60,
        },
        {
          patient_phone: '919988776655',
          direction: 'outbound',
          sender: 'doctor',
          content: 'Rajesh ji, please come to the clinic today evening. 102 after 2 days needs examination.',
          msg_type: 'text',
          protocol_id: null,
          minutes_ago: 45,
        },
      ]

      for (const msg of sampleMessages) {
        await client.query(`
          INSERT INTO messages (patient_phone, doctor_id, direction, sender, content, msg_type, protocol_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, now() - interval '${msg.minutes_ago} minutes')
        `, [msg.patient_phone, doctorId, msg.direction, msg.sender, msg.content, msg.msg_type, msg.protocol_id])
      }
      console.log('Messages: 4 sample')
    }

    console.log('\n✅ Seed complete!')
  })
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
