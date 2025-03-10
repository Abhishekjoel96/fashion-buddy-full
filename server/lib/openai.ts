import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
          content: "You are a skin tone analysis expert. Analyze the image and provide skin tone details in JSON format."
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