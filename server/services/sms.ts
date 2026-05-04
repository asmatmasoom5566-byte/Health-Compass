import twilio from 'twilio';

// Initialize Twilio if credentials are available
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: ReturnType<typeof twilio> | null = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Send SMS with OTP code
 */
export async function sendSMSOTP(phone: string, otp: string): Promise<void> {
  if (!TWILIO_ACCOUNT_SID || !twilioClient) {
    console.log('📱 [MOCK] SMS OTP for', phone, ':', otp);
    return;
  }

  try {
    await twilioClient.messages.create({
      body: `Your verification code is: ${otp}. This code expires in 10 minutes.`,
      from: TWILIO_PHONE_NUMBER,
      to: phone,
    });
    console.log('✅ SMS OTP sent to', phone);
  } catch (error) {
    console.error('❌ Failed to send SMS OTP:', error);
    throw new Error('Failed to send SMS OTP');
  }
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it starts with 0, replace with country code (default +1)
  if (digits.startsWith('0')) {
    return `+1${digits.substring(1)}`;
  }
  
  // If it doesn't start with +, add +
  if (!phone.startsWith('+')) {
    return `+${digits}`;
  }
  
  return phone;
}
