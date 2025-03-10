import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  try {
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${to}`,
      body: message
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to send WhatsApp message: ${errorMessage}`);
  }
}

export function validateTwilioRequest(
  signature: string,
  url: string,
  params: Record<string, unknown>
): boolean {
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
}