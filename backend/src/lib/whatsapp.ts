export async function sendWhatsAppMessage(to: string, text: string) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    console.error('WhatsApp send error:', err)
    throw new Error('Failed to send WhatsApp message')
  }

  return res.json()
}

export async function sendWhatsAppButtons(
  to: string,
  body: string,
  buttons: { id: string; title: string }[]
) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: body },
          action: {
            buttons: buttons.map((b) => ({
              type: 'reply',
              reply: { id: b.id, title: b.title },
            })),
          },
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    console.error('WhatsApp button error:', err)
    throw new Error('Failed to send WhatsApp buttons')
  }

  return res.json()
}

export async function sendWhatsAppMenu(to: string, body: string, items: { id: string; title: string }[]) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: body },
          action: {
            button: 'View Options',
            sections: [
              {
                title: 'How can we help?',
                rows: items.map((item) => ({
                  id: item.id,
                  title: item.title.substring(0, 24),
                })),
              },
            ],
          },
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    console.error('WhatsApp menu error:', err)
    throw new Error('Failed to send WhatsApp menu')
  }

  return res.json()
}

export async function sendWhatsAppSpecialtyList(to: string, body: string, specialties: string[]) {
  // WhatsApp allows max 10 rows per section, up to 10 sections (100 items)
  const sections = []
  for (let i = 0; i < specialties.length; i += 10) {
    const chunk = specialties.slice(i, i + 10)
    sections.push({
      title: sections.length === 0 ? 'Specialties' : 'More Specialties',
      rows: chunk.map((s) => ({ id: `specialty_${s}`, title: s.substring(0, 24) })),
    })
  }

  const res2 = await fetch(
    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: body },
          action: {
            button: 'Select Specialty',
            sections,
          },
        },
      }),
    }
  )

  if (!res2.ok) {
    const err = await res2.json()
    console.error('WhatsApp specialty list error:', err)
    throw new Error('Failed to send WhatsApp specialty list')
  }

  return res2.json()
}
