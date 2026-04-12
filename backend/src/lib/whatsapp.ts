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
