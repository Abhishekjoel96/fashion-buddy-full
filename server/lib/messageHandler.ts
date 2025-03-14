import { storage } from "../storage";
import { sendWhatsAppMessage } from "./twilio";
import { analyzeSkinTone, type SkinToneAnalysis } from "./openai";
import { searchProducts } from "./shopping";
import axios from "axios";

const WELCOME_MESSAGE = `Welcome to WhatsApp Fashion Buddy! 
I can help you find clothes that match your skin tone or try on clothes virtually. 
What would you like to do today?

1. Color Analysis & Shopping Recommendations
2. Virtual Try-On
3. End Chat`;

// Utility function to handle image processing
async function processWhatsAppImage(mediaUrl: string): Promise<{ base64Data: string; contentType: string }> {
  console.log("Starting image processing for URL:", mediaUrl);
  try {
    // First check the content type with a HEAD request
    const headResponse = await axios.head(mediaUrl);
    const contentType = headResponse.headers['content-type'];

    // Log image metadata for debugging
    console.log("Image metadata:", {
      contentType,
      contentLength: headResponse.headers['content-length'],
      url: mediaUrl
    });

    // Verify supported image format
    if (!contentType.startsWith('image/')) {
      throw new Error(`Unsupported media type: ${contentType}`);
    }

    // Fetch the actual image
    const response = await axios.get(mediaUrl, {
      responseType: 'arraybuffer'
    });

    // Convert to base64
    const base64Data = Buffer.from(response.data).toString('base64');

    return {
      base64Data,
      contentType
    };
  } catch (error) {
    console.error("Error processing WhatsApp image:", error);
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function handleIncomingMessage(
  from: string,
  message: string,
  mediaUrl?: string,
  messageType?: string
): Promise<void> {
  try {
    // Skip processing status update messages
    if (messageType === 'read' || messageType === 'delivered' || messageType === 'sent') {
      console.log(`Skipping status update message: ${messageType}`);
      return;
    }

    const phoneNumber = from.replace('whatsapp:', '');
    let user = await storage.getUser(phoneNumber);
    let analysis: SkinToneAnalysis | undefined;

    console.log("Processing message:", {
      from: phoneNumber,
      hasMedia: !!mediaUrl,
      messageType,
      messageContent: message
    });

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
        console.log("Processing photo webhook:", {
          mediaUrl,
          messageBody: message,
          allParams: session.context
        });
        
        if (!mediaUrl) {
          console.log("No media URL received in message");
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

        try {
          const { base64Data, contentType } = await processWhatsAppImage(mediaUrl);
          analysis = await analyzeSkinTone(base64Data, contentType);

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
              analyzedImage: base64Data,
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
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error("Error processing photo:", errorMessage);

          const userErrorMessage = "Sorry, I couldn't process your photo. Please make sure to send a clear, well-lit photo in JPEG or PNG format. Try taking the photo again with better lighting.";

          await sendWhatsAppMessage(phoneNumber, userErrorMessage);

          // Store error message in conversation
          await storage.createConversation({
            userId: user.id,
            sessionId: session.id,
            message: userErrorMessage,
            messageType: 'system'
          });
        }
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
          "3": "3000-5000"
        };

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

        const products = await searchProducts(`${user.skinTone} colored shirts`, selectedBudget);
        let productMessage = "Here are some recommendations based on your skin tone:\n\n";

        products.forEach((product, index) => {
          productMessage += `${index + 1}. ${product.title}
   💰 Price: ₹${product.price}
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
    console.error("Error handling message:", errorMessage);
    throw error;
  }
}