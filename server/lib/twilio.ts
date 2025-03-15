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

export async function getMediaContent(mediaUrl: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  try {
    // Extract Media SID from URL
    const mediaSid = mediaUrl.split('/').pop()?.split('?')[0];
    if (!mediaSid || !mediaSid.startsWith('ME')) {
      throw new Error('Invalid media URL format');
    }

    console.log('Fetching media with SID:', mediaSid);

    // Get media using Twilio client
    const media = await client.media(mediaSid).fetch();
    const contentType = media.contentType;

    // Get the media content
    const response = await fetch(mediaUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('Successfully fetched media:', {
      contentType,
      size: buffer.length,
      mediaSid
    });

    return {
      buffer,
      contentType
    };
  } catch (error) {
    console.error('Error fetching media:', error);
    throw error;
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

    // Log validation details
    console.log("Validating Twilio request with:", {
      authToken: authToken ? "present" : "missing",
      signature: twilioSignature,
      url,
      paramKeys: Object.keys(params)
    });

    // During testing, we'll be more permissive with validation
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: Allowing webhook requests");
      return true;
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