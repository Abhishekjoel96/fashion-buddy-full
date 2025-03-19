import OpenAI from "openai";
import axios from 'axios';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Common Indian skin tones for mapping recommendations
const indianSkinTones = [
  {
    tone: "Deep Brown",
    undertone: "Warm",
    recommendedColors: ["Deep Red", "Mustard Yellow", "Forest Green", "Royal Blue", "Orange"],
    colorsToAvoid: ["Pastels", "Light Gray", "Neon Colors", "Pale Pink", "Light Yellow"]
  },
  {
    tone: "Medium Brown",
    undertone: "Neutral",
    recommendedColors: ["Navy Blue", "Emerald Green", "Burgundy", "Purple", "Teal"],
    colorsToAvoid: ["Bright Orange", "Neon Green", "Hot Pink", "Electric Blue"]
  },
  {
    tone: "Wheatish",
    undertone: "Cool",
    recommendedColors: ["Maroon", "Olive Green", "Deep Purple", "Charcoal Gray", "Deep Blue"],
    colorsToAvoid: ["Bright Yellow", "Orange", "Neon Colors", "Very Light Pastels"]
  },
  {
    tone: "Light Brown",
    undertone: "Warm",
    recommendedColors: ["Coral", "Peach", "Golden Yellow", "Turquoise", "Sage Green"],
    colorsToAvoid: ["Stark White", "Pale Gray", "Neon Pink", "Ice Blue"]
  },
  {
    tone: "Dusky",
    undertone: "Neutral",
    recommendedColors: ["Deep Green", "Wine Red", "Navy", "Plum", "Bronze"],
    colorsToAvoid: ["Bright Pastels", "Neon Colors", "Very Light Colors"]
  }
];

export interface SkinToneAnalysis {
  tone: string;
  undertone: string;
  recommendedColors: string[];
  colorsToAvoid: string[];
}

// Helper function to find the closest matching skin tone from our predefined list
function findClosestSkinTone(analyzedTone: string, analyzedUndertone: string): SkinToneAnalysis {
  // Default to Medium Brown if no match found
  let closestMatch = indianSkinTones[1];

  // Convert to lowercase for comparison
  const toneLC = analyzedTone.toLowerCase();
  const undertoneLC = analyzedUndertone.toLowerCase();

  // Find matching skin tone based on keywords
  for (const tone of indianSkinTones) {
    if (
      toneLC.includes(tone.tone.toLowerCase()) ||
      undertoneLC.includes(tone.undertone.toLowerCase())
    ) {
      closestMatch = tone;
      break;
    }
  }

  return closestMatch;
}

export async function analyzeSkinTone(
  imageBase64: string,
  imageUrl: string
): Promise<SkinToneAnalysis> {
  try {
    // Ensure we have a valid image URL
    if (!imageUrl) {
      throw new Error("No image URL provided for skin tone analysis");
    }

    // Download image for analysis
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64')}`
      }
    });

    // Convert to base64
    const base64Image = Buffer.from(response.data).toString('base64');
    const contentType = response.headers['content-type'];
    const base64Url = `data:${contentType};base64,${base64Image}`;

    // Use GPT-4V to analyze the skin tone
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a skin tone analysis expert. Analyze the provided selfie and return details in this exact format:
          {
            "tone": "descriptive tone name (e.g., Deep Brown, Medium Brown, Light Brown, etc.)",
            "undertone": "warm/cool/neutral"
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this person's skin tone and undertone from the selfie."
            },
            {
              type: "image_url",
              image_url: {
                url: base64Url
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = gptResponse.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    // Parse the GPT-4V response
    const analysis = JSON.parse(content);

    // Map the analyzed tone to our predefined recommendations
    const matchedTone = findClosestSkinTone(analysis.tone, analysis.undertone);

    console.log("Skin tone analysis result:", {
      analyzed: analysis,
      matched: matchedTone
    });

    return matchedTone;

  } catch (error: unknown) {
    console.error("OpenAI API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to analyze skin tone: ${errorMessage}`);
  }
}