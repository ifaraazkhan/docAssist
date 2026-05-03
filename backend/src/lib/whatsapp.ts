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

export async function sendWhatsAppCTAButton(
  to: string,
  body: string,
  buttonText: string,
  url: string
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
          type: 'cta_url',
          body: { text: body },
          action: {
            name: 'cta_url',
            parameters: {
              display_text: buttonText,
              url,
            },
          },
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    console.error('WhatsApp CTA button error:', err)
    throw new Error('Failed to send WhatsApp CTA button')
  }

  return res.json()
}

/**
 * Upload a media buffer (image/png) to WhatsApp Cloud API.
 * Returns the media_id which can be used in sendWhatsAppImage.
 * Media uploaded this way is retained by Meta for ~30 days.
 */
export async function uploadWhatsAppMedia(
  buffer: Buffer,
  mimeType: string = 'image/png',
  filename: string = 'card.png'
): Promise<string> {
  const form = new FormData()
  form.append('messaging_product', 'whatsapp')
  form.append('type', mimeType)
  form.append('file', new Blob([new Uint8Array(buffer)], { type: mimeType }), filename)

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/media`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
      body: form,
    }
  )

  if (!res.ok) {
    const err = await res.json()
    console.error('WhatsApp media upload error:', err)
    throw new Error('Failed to upload WhatsApp media')
  }

  const data = (await res.json()) as { id: string }
  return data.id
}

/**
 * Send an image via WhatsApp Cloud API.
 * Pass either { mediaId } (from uploadWhatsAppMedia) or { link } (publicly accessible HTTPS URL).
 */
export async function sendWhatsAppImage(
  to: string,
  source: { mediaId?: string; link?: string },
  caption?: string
) {
  if (!source.mediaId && !source.link) {
    throw new Error('sendWhatsAppImage requires mediaId or link')
  }

  const image: Record<string, string> = {}
  if (source.mediaId) image.id = source.mediaId
  if (source.link) image.link = source.link
  if (caption) image.caption = caption

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
        type: 'image',
        image,
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    console.error('WhatsApp image send error:', err)
    throw new Error('Failed to send WhatsApp image')
  }

  return res.json()
}

/**
 * Send a WhatsApp template message (marketing / utility).
 * Controlled by WHATSAPP_WELCOME_TEMPLATE_ENABLED env flag.
 * Template must be pre-approved in Meta Business Manager.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode = 'en'
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
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    console.error('WhatsApp template error:', err)
    throw new Error('Failed to send WhatsApp template')
  }

  return res.json()
}

export async function sendWhatsAppSpecialtyList(to: string, body: string, specialties: string[]) {
  // WhatsApp allows max 10 rows TOTAL in a list message
  // Show first 9 specialties + "Other" = 10 rows
  const filtered = specialties.filter((s) => s !== 'Other')
  const display = filtered.slice(0, 9)
  const rows = display.map((s) => ({ id: `specialty_${s}`, title: s.substring(0, 24) }))
  rows.push({ id: 'specialty_Other', title: 'Other' })

  const sections = [{ title: 'Select your specialty', rows }]

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
