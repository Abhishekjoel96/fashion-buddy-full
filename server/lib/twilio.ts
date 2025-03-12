
import twilio from "twilio";
import fetch from "node-fetch";
import { createHmac } from "crypto";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Maximum image size for processing (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export async function sendWhatsAppMessage(
  to: string, 
  message: string, 
  mediaBase64?: string
): Promise<void> {
  try {
    // Format the phone number to ensure it has proper country code
    const formattedNumber = to.startsWith('+') ? to : `+${to}`;

    // Always prefix numbers with "whatsapp:" for WhatsApp messaging
    const fromNumber = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;
    const toNumber = `whatsapp:${formattedNumber}`;

    console.log(`Sending from ${fromNumber} to ${toNumber}`);

    const messageParams: any = {
      from: fromNumber,
      to: toNumber,
      body: message
    };

    // Add media if provided
    if (mediaBase64) {
      // Host the image on a temporary URL service or use Twilio's MediaContentSid
      // For simplicity, we'll use a public URL service in this example
      // In production, you would want to use a secure method
      const mediaUrl = await uploadBase64Image(mediaBase64);
      messageParams.mediaUrl = [mediaUrl];
    }

    await client.messages.create(messageParams);

    console.log(`Successfully sent WhatsApp message to ${to}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to send WhatsApp message: ${errorMessage}`);
    throw new Error(`Failed to send WhatsApp message: ${errorMessage}`);
  }
}

// Placeholder for image upload function
// In a real implementation, you would upload to a secure storage service
async function uploadBase64Image(base64Image: string): Promise<string> {
  // This is a placeholder. Replace with actual implementation for a production app.
  // Example: upload to AWS S3, or other image hosting service
  return "https://example.com/image.jpg";
}

export async function fetchTwilioMedia(mediaUrl: string): Promise<{ buffer: Buffer; contentType: string | null }> {
  try {
    console.log(`Starting to fetch media from: ${mediaUrl}`);
    
    // Create proper authentication for Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
    const authToken = process.env.TWILIO_AUTH_TOKEN as string;
    
    // Base64 encode credentials for Basic Auth
    const authString = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    let retries = 0;
    const maxRetries = 3;
    let response;
    let error;
    
    while (retries < maxRetries) {
      try {
        console.log(`Fetching attempt ${retries + 1} for: ${mediaUrl}`);
        
        response = await fetch(mediaUrl, {
          headers: {
            'Authorization': `Basic ${authString}`
          },
          timeout: 30000 // 30 second timeout
        });
        
        if (response.ok) {
          break; // Success, exit the retry loop
        }
        
        console.warn(`Fetch attempt ${retries + 1} failed with status: ${response.status} ${response.statusText}`);
        error = new Error(`HTTP error: ${response.status} ${response.statusText}`);
      } catch (e) {
        console.warn(`Fetch attempt ${retries + 1} threw an exception:`, e);
        error = e;
      }
      
      retries++;
      if (retries < maxRetries) {
        // Exponential backoff with jitter
        const delay = Math.floor(Math.random() * 1000) + Math.pow(2, retries) * 500;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    if (!response || !response.ok) {
      throw error || new Error(`Failed to fetch media after ${maxRetries} attempts`);
    }
    
    const contentType = response.headers.get('content-type');
    console.log(`Media content type: ${contentType}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Media size: ${buffer.byteLength} bytes`);
    
    // Check if image is too large
    if (buffer.byteLength > MAX_IMAGE_SIZE) {
      console.warn(`Image size (${buffer.byteLength} bytes) exceeds maximum size (${MAX_IMAGE_SIZE} bytes)`);
      // In a production app, you might want to resize the image here
    }
    
    return { buffer, contentType };
  } catch (error) {
    console.error("Error fetching Twilio media:", error);
    throw new Error(`Failed to fetch media: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function validateTwilioRequest(
  url: string,
  params: Record<string, string>,
  twilioSignature: string
): boolean {
  try {
    if (!process.env.TWILIO_AUTH_TOKEN) {
      console.error("TWILIO_AUTH_TOKEN is not set");
      return false;
    }

    const hmac = createHmac("sha1", process.env.TWILIO_AUTH_TOKEN);
    
    // Sort the keys
    const sortedKeys = Object.keys(params).sort();
    
    // Concatenate the URL and sorted key/value pairs
    let data = url;
    for (const key of sortedKeys) {
      data += key + params[key];
    }
    
    // Calculate the signature
    const expectedSignature = hmac.update(data).digest("base64");
    
    console.log(`Expected signature: ${expectedSignature}`);
    console.log(`Actual signature: ${twilioSignature}`);
    
    // Use a constant-time comparison to prevent timing attacks
    return expectedSignature === twilioSignature;
  } catch (error) {
    console.error("Error validating Twilio request:", error);
    return false;
  }
}

export function detectImageFormat(buffer: Buffer): string {
  // Check file magic numbers to determine format
  if (buffer.length < 4) {
    return 'unknown';
  }
  
  // JPEG: Starts with FFD8FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'jpeg';
  }
  
  // PNG: Starts with 89504E47 (hex for ‰PNG)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'png';
  }
  
  // WEBP: Has "WEBP" at offset 8
  if (buffer.length >= 12 && buffer.slice(8, 12).toString() === 'WEBP') {
    return 'webp';
  }
  
  // GIF: Starts with GIF87a or GIF89a
  if (buffer.length >= 6 && 
      (buffer.slice(0, 6).toString() === 'GIF87a' || 
       buffer.slice(0, 6).toString() === 'GIF89a')) {
    return 'gif';
  }
  
  return 'unknown';
}

export function getBase64WithContentType(buffer: Buffer): string {
  const format = detectImageFormat(buffer);
  const base64 = buffer.toString('base64');
  
  switch (format) {
    case 'jpeg':
      return `data:image/jpeg;base64,${base64}`;
    case 'png':
      return `data:image/png;base64,${base64}`;
    case 'webp':
      return `data:image/webp;base64,${base64}`;
    case 'gif':
      return `data:image/gif;base64,${base64}`;
    default:
      // Generic image format as fallback
      return `data:image/jpeg;base64,${base64}`;
  }
}
