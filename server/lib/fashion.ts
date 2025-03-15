import axios from 'axios';

interface VirtualTryOnResponse {
  processedImageUrl: string;
  success: boolean;
  error?: string;
}

export async function virtualTryOn(
  baseImage: string,
  clothingDescription: string
): Promise<string> {
  try {
    console.log('Starting virtual try-on process:', {
      hasBaseImage: !!baseImage,
      clothingDescription
    });

    // Send to fashion API for virtual try-on
    const response = await axios.post<VirtualTryOnResponse>(
      'https://api.fashionai.com/v1/virtual-tryon',
      {
        image: baseImage,
        clothing: clothingDescription
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FASHION_API_KEY}`
        }
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Virtual try-on failed');
    }

    // Download the processed image
    const imageResponse = await axios.get(response.data.processedImageUrl, {
      responseType: 'arraybuffer'
    });

    // Convert to base64
    const base64Image = Buffer.from(imageResponse.data).toString('base64');
    
    console.log('Successfully processed virtual try-on');
    
    return base64Image;
  } catch (error) {
    console.error('Virtual try-on error:', error);
    throw new Error('Failed to process virtual try-on');
  }
}
