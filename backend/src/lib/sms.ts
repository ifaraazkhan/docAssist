/**
 * SMS OTP sender. Currently a stub that logs to console.
 * Swap in Twilio or MSG91 when credentials are ready.
 */

// Uncomment and configure when Twilio creds are in .env:
// import twilio from 'twilio'
// const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function sendOtp(phone: string, otp: string): Promise<void> {
  // In production, send via Twilio/MSG91:
  // await client.messages.create({
  //   body: `Your DrCliniq verification code is ${otp}. Valid for 5 minutes.`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: `+${phone}`,
  // })

  // Dev mode: log to console
  console.log(`[sms] OTP for +${phone}: ${otp}`)
}

export function generateOtp(): string {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString()
}
