import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface SkinToneAnalysis {
  tone: string;
  undertone: string;
  recommendedColors: string[];
  colorsToAvoid: string[];
}

export async function analyzeSkinTone(
  imageBase64: string,
  contentType: string
): Promise<SkinToneAnalysis> {
  try {
    console.log("Analyzing image with content type:", contentType);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a skin tone analysis expert. Analyze the provided selfie and return details in this exact format:
          {
            "tone": "descriptive tone name",
            "undertone": "warm/cool/neutral",
            "recommendedColors": ["color1", "color2", "color3"],
            "colorsToAvoid": ["color1", "color2", "color3"]
          }`
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
                url: `data:${contentType};base64,${imageBase64}`
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
    console.error("OpenAI API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to analyze skin tone: ${errorMessage}`);
  }
}