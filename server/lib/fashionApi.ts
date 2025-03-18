// Fashion API integration for virtual try-on
import axios from 'axios';
import type { Request } from 'express';

export interface VirtualTryOnResult {
  resultImageUrl: string;
  success: boolean;
  error?: string;
}

interface FashnApiResponse {
  id: string;
  status: 'starting' | 'in_queue' | 'processing' | 'completed' | 'failed';
  output?: string[];
  error: string | null;
}

if (!process.env.FASHN_API_KEY) {
  throw new Error("FASHN_API_KEY environment variable must be set");
}

export async function virtualTryOn(
  fullBodyImageUrl: string,
  garmentImageUrl: string
): Promise<VirtualTryOnResult> {
  try {
    console.log("Starting virtual try-on with Fashion API");
    console.log("Full body image:", fullBodyImageUrl);
    console.log("Garment image:", garmentImageUrl);

    // Make initial API call to start processing
    const response = await axios.post<FashnApiResponse>(
      'https://api.fashn.ai/v1/run',
      {
        model_image: fullBodyImageUrl,
        garment_image: garmentImageUrl,
        category: 'tops', // Since we're focusing on shirts/tops
        mode: 'quality', // For best results
        restore_background: true // To preserve original background
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.FASHN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("Initial API response:", response.data);

    // Poll for completion
    const maxAttempts = 20; // Maximum polling attempts
    const pollingInterval = 2000; // 2 seconds between polls
    let attempts = 0;

    while (attempts < maxAttempts) {
      const statusResponse = await axios.get<FashnApiResponse>(
        `https://api.fashn.ai/v1/status/${response.data.id}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.FASHN_API_KEY}`
          }
        }
      );

      console.log("Status check attempt", attempts + 1, ":", statusResponse.data);

      if (statusResponse.data.status === 'completed' && statusResponse.data.output) {
        return {
          resultImageUrl: statusResponse.data.output[0],
          success: true
        };
      }

      if (statusResponse.data.status === 'failed') {
        throw new Error(statusResponse.data.error || 'Virtual try-on failed');
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
      attempts++;
    }

    throw new Error('Timeout waiting for virtual try-on completion');
  } catch (error) {
    console.error("Fashion API error:", error);
    return {
      resultImageUrl: "",
      success: false,
      error: error instanceof Error ? error.message : "Failed to process virtual try-on"
    };
  }
}

// Webhook handler for asynchronous processing (if needed later)
export async function handleFashionApiWebhook(req: Request): Promise<void> {
  const webhookData = req.body as FashnApiResponse;
  console.log("Received Fashion API webhook:", webhookData);

  // Here you could implement webhook handling if needed
  // For example, sending a new WhatsApp message when processing completes
}