export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  clinicName: string;
  phone: string;
  email: string;
  avatar?: string;
  plan: "free" | "pro" | "premium";
  whatsappConnected: boolean;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isUrgent: boolean;
  protocolUsed?: string;
}

export interface Message {
  id: string;
  patientId: string;
  content: string;
  timestamp: string;
  sender: "patient" | "bot" | "doctor";
  type: "text" | "image" | "protocol";
  protocolName?: string;
}

export interface PrivateNote {
  id: string;
  patientId: string;
  content: string;
  timestamp: string;
}

export interface Protocol {
  id: string;
  title: string;
  keywords: string[];
  replyText: string;
  replyImage?: string;
  isActive: boolean;
  addToMenu: boolean;
  usageCount: number;
  disclaimer: string;
}

export const mockDoctor: Doctor = {
  id: "doc-1",
  name: "Dr. Priya Sharma",
  specialty: "General Physician",
  clinicName: "Sharma Clinic",
  phone: "+91 98765 43210",
  email: "priya@sharmaclinic.in",
  plan: "pro",
  whatsappConnected: true,
};

export const mockProtocols: Protocol[] = [
  {
    id: "proto-1",
    title: "Fever Management",
    keywords: ["fever", "bukhar", "temperature", "hot", "tapman"],
    replyText:
      "🌡️ *Fever Management*\n\n1. Take Paracetamol 500mg (Crocin/Dolo) every 6 hours\n2. Stay hydrated — drink ORS, coconut water, or nimbu paani\n3. Sponge with lukewarm water (NOT cold)\n4. Rest and avoid heavy food\n5. Monitor temperature every 4 hours\n\n⚠️ Visit the clinic immediately if:\n• Fever exceeds 103°F / 39.4°C\n• Persists beyond 3 days\n• Accompanied by rash, stiff neck, or confusion",
    isActive: true,
    addToMenu: true,
    usageCount: 142,
    disclaimer: "Visit the clinic if symptoms persist beyond 48 hours.",
  },
  {
    id: "proto-2",
    title: "Diarrhea & Vomiting",
    keywords: ["diarrhea", "vomiting", "loose motion", "ulti", "pet kharab", "dast"],
    replyText:
      "💧 *Diarrhea & Vomiting Care*\n\n1. Start ORS immediately — small sips every 5 minutes\n2. Avoid milk, spicy food, and oily items\n3. Eat light — khichdi, curd rice, bananas\n4. Take Zinc 20mg once daily (adults)\n5. Do NOT take antibiotics without prescription\n\n⚠️ Visit the clinic immediately if:\n• Blood in stool or vomit\n• No urine for 6+ hours\n• Severe cramps or dizziness\n• Child under 5 years affected",
    isActive: true,
    addToMenu: true,
    usageCount: 98,
    disclaimer: "Visit the clinic if symptoms persist beyond 24 hours.",
  },
  {
    id: "proto-3",
    title: "Cold & Cough",
    keywords: ["cold", "cough", "sardi", "khansi", "sneezing", "runny nose"],
    replyText:
      "🤧 *Cold & Cough Care*\n\n1. Steam inhalation 2-3 times daily\n2. Warm salt water gargle\n3. Drink warm fluids — adrak chai, haldi doodh\n4. Take Cetirizine 10mg at night for sneezing\n5. Honey + tulsi for sore throat\n\n⚠️ Visit the clinic if:\n• Cough persists beyond 7 days\n• Difficulty breathing or wheezing\n• High fever with body ache\n• Yellowish/greenish sputum",
    isActive: true,
    addToMenu: true,
    usageCount: 76,
    disclaimer: "Visit the clinic if symptoms persist beyond 7 days.",
  },
  {
    id: "proto-4",
    title: "Headache",
    keywords: ["headache", "sir dard", "migraine", "head pain"],
    replyText:
      "🧠 *Headache Relief*\n\n1. Take Paracetamol 500mg\n2. Rest in a dark, quiet room\n3. Stay hydrated\n4. Apply balm on forehead and temples\n5. Avoid screen time for 1-2 hours\n\n⚠️ Visit the clinic if:\n• Sudden severe headache (worst of your life)\n• Accompanies fever and stiff neck\n• Vision changes or confusion\n• Recurring headaches (3+ times/week)",
    isActive: true,
    addToMenu: false,
    usageCount: 45,
    disclaimer: "Visit the clinic if symptoms persist beyond 48 hours.",
  },
  {
    id: "proto-5",
    title: "Clinic Timings",
    keywords: ["time", "timing", "open", "close", "hours", "kab", "schedule"],
    replyText:
      "🏥 *Clinic Timings*\n\nSharma Clinic, Sector 22, Noida\n\n📅 Monday – Saturday\n🕐 Morning: 9:00 AM – 1:00 PM\n🕐 Evening: 5:00 PM – 8:00 PM\n\n🚫 Sunday: Closed\n📞 Emergency: +91 98765 43210\n\nPlease book an appointment to avoid waiting.",
    isActive: true,
    addToMenu: true,
    usageCount: 234,
    disclaimer: "",
  },
];

export const mockPatients: Patient[] = [
  {
    id: "pat-1",
    name: "Rajesh Kumar",
    phone: "+91 99887 76655",
    lastMessage: "Doctor sahab, mujhe 2 din se bukhar aa raha hai",
    lastMessageTime: "10:32 AM",
    unreadCount: 3,
    isUrgent: true,
    protocolUsed: "Fever Management",
  },
  {
    id: "pat-2",
    name: "Anita Verma",
    phone: "+91 88776 65544",
    lastMessage: "Thank you doctor, feeling better now",
    lastMessageTime: "9:15 AM",
    unreadCount: 0,
    isUrgent: false,
    protocolUsed: "Cold & Cough",
  },
  {
    id: "pat-3",
    name: "Mohammed Faisal",
    phone: "+91 77665 54433",
    lastMessage: "Clinic ka timing kya hai?",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    isUrgent: false,
    protocolUsed: "Clinic Timings",
  },
  {
    id: "pat-4",
    name: "Sunita Devi",
    phone: "+91 66554 43322",
    lastMessage: "Bachche ko raat se ulti ho rahi hai, please help urgently",
    lastMessageTime: "8:45 AM",
    unreadCount: 5,
    isUrgent: true,
  },
  {
    id: "pat-5",
    name: "Vikram Singh",
    phone: "+91 55443 32211",
    lastMessage: "protocol: Fever Management sent",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    isUrgent: false,
    protocolUsed: "Fever Management",
  },
  {
    id: "pat-6",
    name: "Prerna Gupta",
    phone: "+91 44332 21100",
    lastMessage: "Mujhe kal se sir mein bahut dard ho raha hai",
    lastMessageTime: "Yesterday",
    unreadCount: 1,
    isUrgent: false,
    protocolUsed: "Headache",
  },
  {
    id: "pat-7",
    name: "Amit Patel",
    phone: "+91 33221 10099",
    lastMessage: "Appointment le sakta hoon kya kal ka?",
    lastMessageTime: "2 days ago",
    unreadCount: 0,
    isUrgent: false,
  },
];

export const mockMessages: Record<string, Message[]> = {
  "pat-1": [
    {
      id: "msg-1",
      patientId: "pat-1",
      content: "Namaste doctor",
      timestamp: "10:28 AM",
      sender: "patient",
      type: "text",
    },
    {
      id: "msg-2",
      patientId: "pat-1",
      content: "Welcome to Sharma Clinic! 🏥\n\nPlease choose from the menu below or type your concern:\n\n1️⃣ Fever Management\n2️⃣ Diarrhea & Vomiting\n3️⃣ Cold & Cough\n4️⃣ Clinic Timings\n5️⃣ About Dr. Sharma",
      timestamp: "10:28 AM",
      sender: "bot",
      type: "text",
    },
    {
      id: "msg-3",
      patientId: "pat-1",
      content: "1",
      timestamp: "10:29 AM",
      sender: "patient",
      type: "text",
    },
    {
      id: "msg-4",
      patientId: "pat-1",
      content: mockProtocols[0].replyText,
      timestamp: "10:29 AM",
      sender: "bot",
      type: "protocol",
      protocolName: "Fever Management",
    },
    {
      id: "msg-5",
      patientId: "pat-1",
      content: "Doctor sahab, mujhe 2 din se bukhar aa raha hai, paracetamol se bhi nahi utar raha",
      timestamp: "10:32 AM",
      sender: "patient",
      type: "text",
    },
  ],
  "pat-4": [
    {
      id: "msg-6",
      patientId: "pat-4",
      content: "Hello doctor",
      timestamp: "8:40 AM",
      sender: "patient",
      type: "text",
    },
    {
      id: "msg-7",
      patientId: "pat-4",
      content: "Welcome to Sharma Clinic! 🏥\n\nPlease choose from the menu below or type your concern.",
      timestamp: "8:40 AM",
      sender: "bot",
      type: "text",
    },
    {
      id: "msg-8",
      patientId: "pat-4",
      content: "Bachche ko raat se ulti ho rahi hai, please help urgently",
      timestamp: "8:41 AM",
      sender: "patient",
      type: "text",
    },
    {
      id: "msg-9",
      patientId: "pat-4",
      content: "⚠️ Your message has been flagged as URGENT. Dr. Sharma will respond shortly.\n\nIn the meantime, here is general guidance:",
      timestamp: "8:41 AM",
      sender: "bot",
      type: "text",
    },
    {
      id: "msg-10",
      patientId: "pat-4",
      content: mockProtocols[1].replyText,
      timestamp: "8:41 AM",
      sender: "bot",
      type: "protocol",
      protocolName: "Diarrhea & Vomiting",
    },
    {
      id: "msg-11",
      patientId: "pat-4",
      content: "Uski age sirf 3 saal hai, ORS de sakti hoon?",
      timestamp: "8:43 AM",
      sender: "patient",
      type: "text",
    },
    {
      id: "msg-12",
      patientId: "pat-4",
      content: "Kitni baar ulti hui hai raat se?",
      timestamp: "8:45 AM",
      sender: "patient",
      type: "text",
    },
  ],
};

export const mockNotes: Record<string, PrivateNote[]> = {
  "pat-1": [
    {
      id: "note-1",
      patientId: "pat-1",
      content: "Known diabetic patient. Check blood sugar if fever persists. Last visit: March 2026 — prescribed Metformin 500mg.",
      timestamp: "March 15, 2026",
    },
  ],
  "pat-4": [
    {
      id: "note-2",
      patientId: "pat-4",
      content: "Child patient (3 yrs). Mother usually brings. Check dehydration level — may need IV if vomiting doesn't stop. Allergic to Domperidone.",
      timestamp: "Today, 8:50 AM",
    },
  ],
};

export const stats = {
  totalPatients: 142,
  autoHandled: 118,
  needsAttention: 6,
  protocolsActive: 5,
  messagesThisWeek: 487,
  autoHandledPercent: 83,
};
