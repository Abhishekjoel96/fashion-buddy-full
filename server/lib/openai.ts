import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
      // Try with both JPEG and PNG content types as fallbacks
      const imageFormats = [
        `data:image/jpeg;base64,${imageBase64}`,
        `data:image/png;base64,${imageBase64}`,
        `data:image/webp;base64,${imageBase64}`
      ];
      
      // Use the first format as default
      let imageUrl = imageFormats[0];
      
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

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

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