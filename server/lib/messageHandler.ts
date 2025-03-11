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
          
          console.log(`Processing image: ${mediaUrl} with content type: ${contentType}`);
          
          // Send a response to user while analysis is happening
          await sendWhatsAppMessage(
            phoneNumber,
            "I'm analyzing your photo now. This may take a moment..."
          );
          
          analysis = await analyzeSkinTone(base64Image);
        } catch (error) {
          console.error("Image analysis error:", error);
          await sendWhatsAppMessage(
            phoneNumber,
            "I had trouble analyzing your photo. Please try again with a clear selfie in JPEG or PNG format, taken in good lighting."
          );
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