
import twilio from "twilio";

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
  throw new Error("Missing required Twilio environment variables");
}

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  try {
    await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${to}`
    });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
}

export async function validateTwilioRequest(signature: string, url: string, body: any): Promise<boolean> {
  if (process.env.BYPASS_TWILIO_VALIDATION === 'true') {
    console.log("Development mode: Allowing webhook requests");
    return true; 
  }

  try {
    return twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN as string,
      signature,
      url,
      body
    );
  } catch (error) {
    console.error("Twilio validation error:", error);
    return false;
  }
}

export async function fetchTwilioMedia(mediaUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // For Twilio media URLs, we need to use authentication
    const options: RequestInit = {};
    if (mediaUrl.includes('api.twilio.com')) {
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      options.headers = {
        'Authorization': `Basic ${auth}`
      };
    }

    const response = await fetch(mediaUrl, options);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return { buffer, contentType };
  } catch (error) {
    console.error('Error fetching Twilio media:', error);
    throw error;
  }
}
