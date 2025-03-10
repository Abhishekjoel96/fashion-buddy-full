import twilio from "twilio";

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
  throw new Error("Missing required Twilio environment variables");
}

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  try {
    console.log(`Attempting to send WhatsApp message to ${to}`);
    // Format the phone number to ensure it has proper country code
    const formattedNumber = to.startsWith('+') ? to : `+${to}`;

    // Always prefix numbers with "whatsapp:" for WhatsApp messaging
    const fromNumber = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;
    const toNumber = `whatsapp:${formattedNumber}`;

    console.log(`Sending from ${fromNumber} to ${toNumber}`);

    await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message
    });

    console.log(`Successfully sent WhatsApp message to ${to}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to send WhatsApp message: ${errorMessage}`);
    throw new Error(`Failed to send WhatsApp message: ${errorMessage}`);
  }
}

export function validateTwilioRequest(
  signature: string,
  url: string,
  params: Record<string, unknown>
): boolean {
  try {
    const twilioSignature = signature;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!authToken) {
      throw new Error("TWILIO_AUTH_TOKEN is not set");
    }

    return twilio.validateRequest(
      authToken,
      twilioSignature,
      url,
      params
    );
  } catch (error: unknown) {
    console.error("Twilio validation error:", error);
    return false;
  }
}