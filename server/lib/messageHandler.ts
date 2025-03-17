import { storage } from "../storage";
import { sendWhatsAppMessage } from "./twilio";
import { analyzeSkinTone, type SkinToneAnalysis } from "./openai";
import { searchProducts } from "./shopping";

const WELCOME_MESSAGE = `Welcome to WhatsApp Fashion Buddy! 
I can help you find clothes that match your skin tone or try on clothes virtually. 
What would you like to do today?

1. Color Analysis & Shopping Recommendations
2. Virtual Try-On
3. End Chat`;

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
          const nextMessage = "Great! Let's analyze your skin tone to give you personalized color recommendations!";
          await storage.updateSession(session.id, {
            currentState: "AWAITING_COLOR_ANALYSIS",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, nextMessage);

          // Get random skin tone analysis directly
          analysis = await analyzeSkinTone("", "");

          // Update user's skin tone
          await storage.updateUser(user.id, {
            skinTone: analysis.tone,
            preferences: user.preferences || {}
          });

          const colorMessage = `🔍 Based on my analysis, your skin tone appears to be:
Skin Tone: ${analysis.tone}
Undertone: ${analysis.undertone}

Recommended Colors: 
${analysis.recommendedColors.join(", ")}

Colors to Avoid:
${analysis.colorsToAvoid.join(", ")}

Would you like to see clothing recommendations in these colors?
1. Budget Range ₹500-₹1500
2. Budget Range ₹1500-₹3000
3. Budget Range ₹3000+
4. Return to Main Menu`;

          await storage.updateSession(session.id, {
            currentState: "AWAITING_BUDGET",
            lastInteraction: new Date(),
            context: {
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

        } else if (message === "2") {
          const nextMessage = "For virtual try-on, I'll need two pictures:\n1. A full-body photo of yourself\n2. The garment/shirt you want to try on\n\nPlease send your full-body photo first.";
          await storage.updateSession(session.id, {
            currentState: "AWAITING_FULLBODY",
            lastInteraction: new Date(),
            context: null
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

      case "AWAITING_BUDGET":
        if (message === "4") {
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);
          return;
        }

        const budgetRanges = {
          "1": "500-1500",
          "2": "1500-3000",
          "3": "3000+"
        };

        const selectedBudget = budgetRanges[message as keyof typeof budgetRanges];
        if (!selectedBudget) {
          const invalidMessage = "Please select a valid budget range (1-3) or 4 to return to main menu";
          await sendWhatsAppMessage(phoneNumber, invalidMessage);
          return;
        }

        const products = await searchProducts(`${user.skinTone} colored shirts`, selectedBudget);
        const productChunks: string[] = [];
        let currentChunk = "🛍️ Here are some recommendations based on your skin tone:\n\n";

        for (const [index, product] of products.entries()) {
          const productText = `${index + 1}. ${product.title}\n💰 Price: ₹${product.price}\n👕 Brand: ${product.brand}\n🏪 From: ${product.source}\n${product.description ? `📝 ${product.description}\n` : ''}🔗 ${product.link}\n\n`;

          if ((currentChunk + productText).length > 1500) {
            productChunks.push(currentChunk.trim());
            currentChunk = `Continued...\n\n${productText}`;
          } else {
            currentChunk += productText;
          }
        }

        const finalMessage = "\nWhat would you like to do next?\n1. Try these on virtually\n2. See more options\n3. Return to Main Menu";

        if ((currentChunk + finalMessage).length > 1500) {
          productChunks.push(currentChunk.trim());
          productChunks.push(finalMessage);
        } else {
          currentChunk += finalMessage;
          productChunks.push(currentChunk);
        }

        // Send messages in sequence
        for (const chunk of productChunks) {
          await sendWhatsAppMessage(phoneNumber, chunk);
        }

        await storage.updateSession(session.id, {
          currentState: "SHOWING_PRODUCTS",
          lastInteraction: new Date(),
          context: {
            lastMessage: productChunks.join('\n'),
            lastOptions: ["1", "2", "3"]
          }
        });

        await storage.createConversation({
          userId: user.id,
          sessionId: session.id,
          message: productChunks.join('\n'),
          messageType: 'system'
        });
        break;

      case "AWAITING_FULLBODY":
        if (!mediaUrl) {
          await sendWhatsAppMessage(phoneNumber, "Please send your full-body photo to continue.");
          return;
        }

        // Store full-body image
        await storage.createUserImage({
          userId: user.id,
          imageUrl: mediaUrl,
          cloudinaryPublicId: 'fullbody_' + Date.now(),
          imageType: 'full_body'
        });

        const garmentMessage = "Great! Now please send the photo of the garment you'd like to try on.";
        await storage.updateSession(session.id, {
          currentState: "AWAITING_GARMENT",
          lastInteraction: new Date(),
          context: {
            fullBodyImage: mediaUrl
          }
        });

        await sendWhatsAppMessage(phoneNumber, garmentMessage);
        break;

      case "AWAITING_GARMENT":
        if (!mediaUrl) {
          await sendWhatsAppMessage(phoneNumber, "Please send the garment photo to continue.");
          return;
        }

        // Store garment image
        await storage.createUserImage({
          userId: user.id,
          imageUrl: mediaUrl,
          cloudinaryPublicId: 'garment_' + Date.now(),
          imageType: 'garment'
        });

        const processingMessage = "Thank you! I'm processing your virtual try-on request. This may take a moment...";
        await sendWhatsAppMessage(phoneNumber, processingMessage);

        // Here you would integrate with the Fashion API
        // For now, we'll send a placeholder response
        const tryOnResponse = "Here's how the garment would look on you! [Virtual try-on image would be here]\n\nWould you like to:\n1. Try another garment\n2. Return to main menu";

        await storage.updateSession(session.id, {
          currentState: "SHOWING_TRYON",
          lastInteraction: new Date(),
          context: {
            fullBodyImage: session.context?.fullBodyImage,
            garmentImage: mediaUrl
          }
        });

        await sendWhatsAppMessage(phoneNumber, tryOnResponse);
        break;

      case "SHOWING_TRYON":
        if (message === "1") {
          const retryMessage = "Please send another garment photo to try on.";
          await storage.updateSession(session.id, {
            currentState: "AWAITING_GARMENT",
            lastInteraction: new Date(),
            context: {
              fullBodyImage: session.context?.fullBodyImage
            }
          });
          await sendWhatsAppMessage(phoneNumber, retryMessage);
        } else if (message === "2") {
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);
        }
        break;
      case "SHOWING_PRODUCTS":
        if (message === "3") {
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);
        }
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
    console.error("Error handling message:", errorMessage);
    throw error;
  }
}