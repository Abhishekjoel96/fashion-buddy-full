import { storage } from "../storage";
import { sendWhatsAppMessage } from "./twilio";
import { analyzeSkinTone, type SkinToneAnalysis } from "./openai";
import { searchProducts } from "./shopping";

const WELCOME_MESSAGE = `👋 Hello! Welcome to WhatsApp Fashion Buddy! 
I can help you find clothes that match your skin tone or try on clothes virtually. 
What would you like to do today?

1. Color Analysis & Shopping Recommendations
2. Virtual Try-On
3. End Chat`;

export async function handleIncomingMessage(
  from: string,
  message: string,
  mediaUrl?: string
) {
  try {
    const phoneNumber = from.replace("whatsapp:", "");
    let user = await storage.getUser(phoneNumber);
    let analysis: SkinToneAnalysis | undefined;

    // Store the incoming message
    if (user) {
      const session = await storage.getSession(user.id);
      if (session) {
        await storage.createConversation({
          userId: user.id,
          sessionId: session.id,
          message,
          messageType: 'user',
          mediaUrl
        });
      }
    }

    if (!user) {
      await sendWhatsAppMessage(
        phoneNumber,
        "Please start your chat from our website first to register your number."
      );
      return;
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

      // Store system message
      await storage.createConversation({
        userId: user.id,
        sessionId: session.id,
        message: WELCOME_MESSAGE,
        messageType: 'system'
      });
      return;
    }

    switch (session.currentState) {
      case "WELCOME":
        if (message === "1") {
          const nextMessage = "Great! Let's start by understanding your skin tone. Please send a clear, well-lit selfie of your face.";
          await storage.updateSession(session.id, {
            currentState: "AWAITING_PHOTO",
            lastInteraction: new Date(),
            context: {
              lastMessage: nextMessage,
              lastOptions: [],
              analyzedImage: undefined
            }
          });
          await sendWhatsAppMessage(phoneNumber, nextMessage);

          // Store system message
          await storage.createConversation({
            userId: user.id,
            sessionId: session.id,
            message: nextMessage,
            messageType: 'system'
          });
        } else if (message === "2") {
          const nextMessage = "Please send a full-body picture and I'll help you try on different outfits virtually!";
          await storage.updateSession(session.id, {
            currentState: "AWAITING_TRYON_PHOTO",
            lastInteraction: new Date(),
            context: {
              lastMessage: nextMessage,
              lastOptions: [],
              virtualTryOnImage: undefined
            }
          });
          await sendWhatsAppMessage(phoneNumber, nextMessage);

          // Store system message
          await storage.createConversation({
            userId: user.id,
            sessionId: session.id,
            message: nextMessage,
            messageType: 'system'
          });
        } else if (message === "3") {
          const thankYouMessage = "Thank you for using WhatsApp Fashion Buddy! Have a great day! 👋";
          await storage.updateSession(session.id, {
            currentState: "ENDED",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, thankYouMessage);

          // Store system message
          await storage.createConversation({
            userId: user.id,
            sessionId: session.id,
            message: thankYouMessage,
            messageType: 'system'
          });
        }
        break;

      case "AWAITING_PHOTO":
        if (!mediaUrl) {
          const retryMessage = "Please send a photo for analysis.";
          await sendWhatsAppMessage(phoneNumber, retryMessage);

          // Store system message
          await storage.createConversation({
            userId: user.id,
            sessionId: session.id,
            message: retryMessage,
            messageType: 'system'
          });
          return;
        }

        const imageResponse = await fetch(mediaUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const imageType = imageResponse.headers.get('content-type');
        const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!supportedTypes.includes(imageType!)) {
          const errorMessage = "Unsupported image format. Please use JPEG, PNG, GIF, or WEBP.";
          await sendWhatsAppMessage(phoneNumber, errorMessage);
          return;
        }
        const base64Image = Buffer.from(imageBuffer).toString("base64");

        analysis = await analyzeSkinTone(base64Image);

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
3. Budget Range ₹3000+
4. Return to Main Menu`;

        await storage.updateSession(session.id, {
          currentState: "AWAITING_BUDGET",
          lastInteraction: new Date(),
          context: {
            analyzedImage: base64Image,
            lastMessage: colorMessage,
            lastOptions: ["1", "2", "3", "4"]
          }
        });

        await sendWhatsAppMessage(phoneNumber, colorMessage);

        // Store system message
        await storage.createConversation({
          userId: user.id,
          sessionId: session.id,
          message: colorMessage,
          messageType: 'system'
        });
        break;

      case "AWAITING_BUDGET":
        if (message === "4") {
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);

          // Store system message
          await storage.createConversation({
            userId: user.id,
            sessionId: session.id,
            message: WELCOME_MESSAGE,
            messageType: 'system'
          });
          return;
        }

        const budgetRanges = {
          "1": "500-1500",
          "2": "1500-3000",
          "3": "3000-10000"
        } as const;

        const selectedBudget = budgetRanges[message as keyof typeof budgetRanges];
        if (!selectedBudget) {
          const invalidMessage = "Please select a valid budget range (1-3) or 4 to return to main menu";
          await sendWhatsAppMessage(phoneNumber, invalidMessage);

          // Store system message
          await storage.createConversation({
            userId: user.id,
            sessionId: session.id,
            message: invalidMessage,
            messageType: 'system'
          });
          return;
        }

        if (!user.skinTone) {
          const errorMessage = "Sorry, we need to analyze your skin tone first. Please send a photo.";
          await sendWhatsAppMessage(phoneNumber, errorMessage);

          // Store system message
          await storage.createConversation({
            userId: user.id,
            sessionId: session.id,
            message: errorMessage,
            messageType: 'system'
          });
          return;
        }

        const products = await searchProducts(
          `clothing ${analysis?.recommendedColors.join(" ") || user.skinTone}`,
          selectedBudget
        );

        let productMessage = "🌟 Here are some fabulous clothing options that perfectly match your skin tone:\n\n";
        products.forEach((product, index) => {
          productMessage += `${index + 1}. ${product.title}
   💰 ₹${product.price}
   👕 Brand: ${product.brand}
   🔗 ${product.link}\n\n`;
        });

        productMessage += "What would you like to do next?\n1. Try these on virtually\n2. See more options\n3. Return to Main Menu";

        await storage.updateSession(session.id, {
          currentState: "SHOWING_PRODUCTS",
          lastInteraction: new Date(),
          context: {
            lastMessage: productMessage,
            lastOptions: ["1", "2", "3"],
            analyzedImage: session.context?.analyzedImage
          }
        });

        await sendWhatsAppMessage(phoneNumber, productMessage);

        // Store system message
        await storage.createConversation({
          userId: user.id,
          sessionId: session.id,
          message: productMessage,
          messageType: 'system'
        });
        break;

      case "SHOWING_PRODUCTS":
        if (message === "3") {
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);

          // Store system message
          await storage.createConversation({
            userId: user.id,
            sessionId: session.id,
            message: WELCOME_MESSAGE,
            messageType: 'system'
          });
        }
        break;

      default:
        await storage.updateSession(session.id, {
          currentState: "WELCOME",
          lastInteraction: new Date(),
          context: null
        });
        await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);

        // Store system message
        await storage.createConversation({
          userId: user.id,
          sessionId: session.id,
          message: WELCOME_MESSAGE,
          messageType: 'system'
        });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in handleIncomingMessage:", error);
    // Send a generic error message to the user.  More specific error handling could be implemented here.
    const phoneNumber = from.replace("whatsapp:", "");
    if (phoneNumber) {
        try {
          await sendWhatsAppMessage(phoneNumber, "Sorry, an error occurred. Please try again later.");
        } catch (msgError) {
          console.error("Failed to send error message:", msgError);
        }
    }
    
  }
}