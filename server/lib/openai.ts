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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a skin tone analysis expert. Use the following comprehensive dataset to provide accurate color recommendations:
          ${JSON.stringify(skinToneData, null, 2)}

          Analyze the image provided and return skin tone details matching this exact format:
          {
            "tone": "descriptive tone name",
            "undertone": "warm/cool/neutral",
            "recommendedColors": ["color1", "color2", "color3"],
            "colorsToAvoid": ["color1", "color2", "color3"]
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

    return JSON.parse(content) as SkinToneAnalysis;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to analyze skin tone: ${errorMessage}`);
  }
}