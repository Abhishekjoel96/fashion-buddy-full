
import { OpenAI } from "openai";
import { skinToneData } from "./skinToneData";

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SkinToneAnalysis {
  tone: string;
  undertone: string;
  recommendedColors: string[];
  colorsToAvoid: string[];
}

// Function to detect image format from binary data
function detectImageFormat(buffer: Buffer): string {
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

// Export the openai instance for use in other modules
export { openai };

// Comprehensive skin tone dataset for RAG
const skinToneData = [
  {
    "skin_tone_undertone": "Very Fair Warm",
    "recommended_colors": "Cream, Ecru, Pale Peach, Light Beige, Vanilla, Soft Yellow",
    "avoid_colors": "Charcoal Gray, Jet Black, Navy, Burgundy, Emerald Green, Ruby Red"
  },
  {
    "skin_tone_undertone": "Medium Olive Warm",
    "recommended_colors": "Olive Green, Mustard, Khaki, Burnt Orange, Gold, Bronze",
    "avoid_colors": "Pastel Pink, Lavender, Silver, Light Blue, White, Cool Gray"
  },
  // Add more entries as needed from the dataset
];

export interface SkinToneAnalysis {
  tone: string;
  undertone: string;
  recommendedColors: string[];
  colorsToAvoid: string[];
}

export async function analyzeSkinTone(imageBase64: string): Promise<SkinToneAnalysis> {
  try {
    console.log("Starting skin tone analysis with OpenAI...");
    
    // Validate the base64 image
    if (!imageBase64 || imageBase64.length < 100) {
      throw new Error("Invalid image data: image is too small or empty");
    }
    
    // For debugging
    const imagePreview = imageBase64.substring(0, 50) + "..."; 
    console.log(`Base64 image preview: ${imagePreview}, length: ${imageBase64.length} chars`);
    
    // Set a timeout for the OpenAI request
    const timeoutMs = 30000; // 30 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      // Detect image format from the binary data
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const format = detectImageFormat(imageBuffer);
      console.log(`Detected image format: ${format}`);
      
      // Create format-specific and fallback URLs
      const imageFormats = [
        `data:image/${format};base64,${imageBase64}`,
        `data:image/jpeg;base64,${imageBase64}`,
        `data:image/png;base64,${imageBase64}`,
        `data:image/webp;base64,${imageBase64}`,
        `data:image;base64,${imageBase64}`  // Generic fallback
      ];
      
      // Use the detected format first
      let imageUrl = imageFormats[0];
      let error;
      
      // Try each format in succession until one works
      for (const formatUrl of imageFormats) {
        try {
          console.log(`Attempting analysis with format: ${formatUrl.split(';')[0]}`);
          
          const response = await openai.chat.completions.create({
            model: "gpt-4o", // Using the latest vision model
            messages: [
              {
                role: "system",
                content: `You are a skin tone analysis expert. Use the following comprehensive dataset to provide accurate color recommendations:
                ${JSON.stringify(skinToneData, null, 2)}

          Analyze the image provided and return skin tone details matching this exact format:
          {
            "tone": "descriptive tone name",
            "undertone": "warm/cool/neutral",
            "recommendedColors": ["color1", "color2", "color3", "color4", "color5"],
            "colorsToAvoid": ["color1", "color2", "color3"]
          }
          
          If the image is not clear or does not contain a human face, respond with an error message in this format:
          {
            "error": "detailed error description",
            "suggestion": "what the user should do"
          }

          Choose the closest matching skin tone from the dataset and provide its recommended colors.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this person's skin tone and provide recommended colors."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ],
        }
      ],
      response_format: { type: "json_object" }
            });
            
            // If we reach here, the format worked
            const content = response.choices[0].message.content;
            if (!content) {
              throw new Error("No content in OpenAI response");
            }
            
            // Parse response as JSON
            try {
              const result = JSON.parse(content);
              
              // Check if there's an error field in the response
              if (result.error) {
                throw new Error(`Analysis error: ${result.error}. ${result.suggestion || ''}`);
              }
              
              clearTimeout(timeoutId);
              return result as SkinToneAnalysis;
            } catch (jsonError) {
              console.error("Error parsing OpenAI response:", jsonError);
              throw new Error("Invalid response format from OpenAI");
            }
          } catch (analysisError) {
            console.warn(`Analysis with format ${formatUrl.split(';')[0]} failed:`, analysisError);
            error = analysisError;
            // Continue to next format
          }
        }
        
        // If we've tried all formats and none worked, throw the last error
        throw error || new Error("Failed to analyze image with any format");

    try {
      // Parse the JSON response
      const parsedData = JSON.parse(content) as SkinToneAnalysis;
      
      // Validate the response format
      if (!parsedData.tone || !parsedData.undertone || 
          !Array.isArray(parsedData.recommendedColors) || parsedData.recommendedColors.length === 0) {
        throw new Error("Invalid response format: missing required fields");
      }
      
      return parsedData;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Failed to parse analysis results");
    }
    
    } catch (innerError) {
      const errorMessage = innerError instanceof Error ? innerError.message : String(innerError);
      console.error(`OpenAI API error: ${errorMessage}`);
      throw innerError;
    } finally {
      clearTimeout(timeoutId); // Clear the timeout
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Skin tone analysis failed: ${errorMessage}`);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Analysis timed out. The image may be too complex or the service is currently busy.");
    }
    
    throw new Error(`Failed to analyze skin tone: ${errorMessage}`);
  }
}