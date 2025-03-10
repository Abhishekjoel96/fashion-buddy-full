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

    // Get sandbox information
    const services = await client.messaging.v1.services.list();
    const whatsappService = services.find(service => 
      service.friendlyName?.toLowerCase().includes('whatsapp')
    );

    if (whatsappService) {
      console.log(`WhatsApp Service Found: ${whatsappService.friendlyName}`);
    }

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
  twilioSignature: string,
  url: string,
  params: any
): boolean {
  try {
    // In development, allow requests to pass through even if they don't validate
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: Allowing webhook requests");
      return true;
    }

    console.log("Validating Twilio request with:", {
      authToken: process.env.TWILIO_AUTH_TOKEN ? "present" : "missing",
      signature: twilioSignature,
      url,
      paramKeys: params ? Object.keys(params) : []
    });

    // Real validation logic
    return twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN || "",
      twilioSignature,
      url,
      params
    );
  } catch (error) {
    console.error("Twilio validation error:", error);
    return false;
  }
}