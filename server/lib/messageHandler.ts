import { storage } from "../storage";
import { sendWhatsAppMessage } from "./twilio";
import { analyzeSkinTone, type SkinToneAnalysis } from "./openai";
import { searchProducts } from "./shopping";
import axios from "axios";

import { client as twilioClient } from './twilio';

const WELCOME_MESSAGE = `Welcome to WhatsApp Fashion Buddy! 
I can help you find clothes that match your skin tone or try on clothes virtually. 
What would you like to do today?

1. Color Analysis & Shopping Recommendations
2. Virtual Try-On
3. End Chat`;

// Simplified image processing function
async function processWhatsAppImage(mediaUrl: string, userId: number): Promise<{ base64Data: string; contentType: string }> {
  try {
    console.log("Processing image from URL:", mediaUrl);

    // Extract Media SID from URL
    const mediaSid = mediaUrl.split('/').pop();
    if (!mediaSid || !mediaSid.startsWith('ME')) {
      throw new Error('Invalid Twilio media SID');
    }

    // Download image directly from Twilio URL
    const response = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID!,
        password: process.env.TWILIO_AUTH_TOKEN!
      }
    });

    const contentType = response.headers['content-type'];
    if (!contentType.startsWith('image/')) {
      throw new Error('Invalid content type: ' + contentType);
    }

    const base64Data = Buffer.from(response.data).toString('base64');
    
    // Store image in database
    await storage.createUserImage({
      userId,
      imageUrl: mediaUrl,
      cloudinaryPublicId: mediaSid,
      imageType: 'selfie'
    });

    return { base64Data, contentType };
      }
    });

    const contentType = mediaResource.contentType;
    if (!contentType.startsWith('image/')) {
      throw new Error('Invalid content type: ' + contentType);
    }

    const base64Data = Buffer.from(response.data).toString('base64');
    console.log("Image processed successfully:", {
      contentType,
      sizeBytes: response.data.length
    });

    return { base64Data, contentType };
  } catch (error) {
    console.error("Image processing error:", error);
    throw error;
  }
}

export async function handleIncomingMessage(
  from: string,
  message: string,
  mediaUrl?: string
): Promise<void> {
  try {
    const phoneNumber = from.replace('whatsapp:', '');
    let user = await storage.getUser(phoneNumber);
    let analysis: SkinToneAnalysis | undefined;

    // Skip messages from Twilio's number
    if (phoneNumber === '+14155238886') {
      console.log("Skipping message from Twilio's number");
      return;
    }


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

          await storage.createConversation({
            userId: user.id,
            sessionId: session.id,
            message: retryMessage,
            messageType: 'system'
          });
          return;
        }

        try {
          // Process and store image
          const { base64Data, contentType } = await processWhatsAppImage(mediaUrl, user.id);

          // Analyze with OpenAI
          analysis = await analyzeSkinTone(base64Data, contentType);
          
          if (!analysis) {
            throw new Error("Failed to analyze image");
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
3. Budget Range ₹3000+
4. Return to Main Menu`;

          await storage.updateSession(session.id, {
            currentState: "AWAITING_BUDGET",
            lastInteraction: new Date(),
            context: {
              analyzedImage: mediaUrl,
              lastMessage: colorMessage,
              lastOptions: ["1", "2", "3", "4"]
            }
          });

          await sendWhatsAppMessage(phoneNumber, colorMessage);

          await storage.createConversation({
            userId: user.id,
            sessionId: session.id,
            message: colorMessage,
            messageType: 'system'
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error("Error processing photo:", errorMessage);

          const userErrorMessage = "Sorry, I couldn't process your photo. Please try sending the photo again. Make sure it's a clear, well-lit selfie of your face.";

          await sendWhatsAppMessage(phoneNumber, userErrorMessage);

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