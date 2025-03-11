import { storage } from "../storage";
import { sendWhatsAppMessage } from "./twilio";
import { analyzeSkinTone, type SkinToneAnalysis } from "./openai";
import { searchProducts } from "./shopping";

const WELCOME_MESSAGE = `👋 Hello! Welcome to WhatsApp Fashion Buddy! 
I can help you find clothes that match your skin tone or try on clothes virtually. 
What would you like to do today?

1. Color Analysis & Shopping Recommendations
2. Virtual Try-On`;

export async function handleIncomingMessage(
  from: string,
  message: string,
  mediaUrl?: string
) {
  try {
    const phoneNumber = from.replace("whatsapp:", "");
    let user = await storage.getUser(phoneNumber);
    let analysis: SkinToneAnalysis | undefined;

    if (!user) {
      user = await storage.createUser({
        phoneNumber,
        skinTone: null,
        preferences: null
      });
    }

    let session = await storage.getSession(user.id);

    if (!session) {
      session = await storage.createSession({
        userId: user.id,
        currentState: "WELCOME",
        lastInteraction: new Date(),
        context: null
      });
      await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);
      return;
    }

    switch (session.currentState) {
      case "WELCOME":
        if (message === "1") {
          await storage.updateSession(session.id, {
            currentState: "AWAITING_PHOTO",
            lastInteraction: new Date(),
            context: {
              lastMessage: "Please send a clear, well-lit selfie of your face.",
              lastOptions: [],
              analyzedImage: undefined
            }
          });
          await sendWhatsAppMessage(
            phoneNumber,
            "Great! Let's start by understanding your skin tone. Please send a clear, well-lit selfie of your face."
          );
        }
        break;

      case "AWAITING_PHOTO":
        if (!mediaUrl) {
          await sendWhatsAppMessage(
            phoneNumber,
            "Please send a photo for analysis."
          );
          return;
        }

        try {
          const imageResponse = await fetch(mediaUrl);
          const contentType = imageResponse.headers.get('content-type');
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64Image = Buffer.from(imageBuffer).toString("base64");
          
          console.log(`Processing image: ${mediaUrl} with content type: ${contentType}, size: ${imageBuffer.byteLength} bytes`);
          
          // Validate image type and size
          if (!contentType || (!contentType.includes('jpeg') && !contentType.includes('png') && !contentType.includes('image'))) {
            console.warn(`Unsupported image format: ${contentType}`);
            await sendWhatsAppMessage(
              phoneNumber,
              "Your image format isn't supported. Please send a JPEG or PNG photo."
            );
            return;
          }
          
          if (imageBuffer.byteLength > 4 * 1024 * 1024) {
            console.warn(`Image too large: ${imageBuffer.byteLength} bytes`);
            await sendWhatsAppMessage(
              phoneNumber,
              "Your image is too large. Please send a smaller photo (under 4MB)."
            );
            return;
          }
          
          // Send a response to user while analysis is happening
          await sendWhatsAppMessage(
            phoneNumber,
            "I'm analyzing your photo now. This may take a moment..."
          );
          
          // Attempt skin tone analysis
          analysis = await analyzeSkinTone(base64Image);
          console.log("Analysis completed successfully:", JSON.stringify(analysis, null, 2));
        } catch (error) {
          console.error("Image analysis error:", error);
          
          // More detailed error message
          let errorMessage = "I had trouble analyzing your photo. ";
          
          if (error instanceof Error) {
            console.error("Error details:", error.message, error.stack);
            
            if (error.message.includes("timeout") || error.message.includes("timed out")) {
              errorMessage += "The analysis took too long to complete. ";
            } else if (error.message.includes("format") || error.message.includes("invalid")) {
              errorMessage += "The image format couldn't be processed. ";
            }
          }
          
          errorMessage += "Please try again with a clear selfie in JPEG or PNG format, taken in good lighting, showing your face clearly.";
          
          await sendWhatsAppMessage(phoneNumber, errorMessage);
          return;
        }

        await storage.updateUser(user.id, {
          skinTone: analysis.tone,
          preferences: user.preferences
        });

        const colorMessage = `🔍 Based on your photo, I've analyzed your skin tone:
Skin Tone: ${analysis.tone}
Undertone: ${analysis.undertone}

Recommended Colors: 
${analysis.recommendedColors.join("\n")}

Would you like to see clothing recommendations in these colors?
1. Budget Range ₹500-₹1500
2. Budget Range ₹1500-₹3000
3. Budget Range ₹3000+`;

        await storage.updateSession(session.id, {
          currentState: "AWAITING_BUDGET",
          lastInteraction: new Date(),
          context: {
            analyzedImage: base64Image,
            lastMessage: colorMessage,
            lastOptions: ["1", "2", "3"]
          }
        });

        await sendWhatsAppMessage(phoneNumber, colorMessage);
        break;

      case "AWAITING_BUDGET":
        const budgetRanges = {
          "1": "500-1500",
          "2": "1500-3000",
          "3": "3000-10000"
        } as const;

        const selectedBudget = budgetRanges[message as keyof typeof budgetRanges];
        if (!selectedBudget) {
          await sendWhatsAppMessage(
            phoneNumber,
            "Please select a valid budget range (1-3)"
          );
          return;
        }

        if (!user.skinTone) {
          await sendWhatsAppMessage(
            phoneNumber,
            "Sorry, we need to analyze your skin tone first. Please send a photo."
          );
          return;
        }

        // Extract recommended colors from analysis or user data
        const recommendedColors = analysis?.recommendedColors || 
          (user.skinTone ? [user.skinTone] : ["blue", "black", "white"]);
        
        // Use enhanced search with color array
        const products = await searchProducts(
          recommendedColors,
          selectedBudget
        );

        let productMessage = "🌟 Here are some fabulous clothing options that perfectly match your skin tone:\n\n";
        products.forEach((product, index) => {
          productMessage += `${index + 1}. ${product.title}
   💰 ₹${product.price}
   👕 Brand: ${product.brand}
   🔗 ${product.link}\n\n`;
        });

        productMessage += "Would you like to try on any of these virtually or see more options?";

        await storage.updateSession(session.id, {
          currentState: "SHOWING_PRODUCTS",
          lastInteraction: new Date(),
          context: {
            lastMessage: productMessage,
            lastOptions: ["try", "more"],
            analyzedImage: session.context?.analyzedImage
          }
        });

        await sendWhatsAppMessage(phoneNumber, productMessage);
        break;

      default:
        await storage.updateSession(session.id, {
          currentState: "WELCOME",
          lastInteraction: new Date(),
          context: null
        });
        await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to handle message: ${errorMessage}`);
  }
}