import { storage } from "../storage";
import { sendWhatsAppMessage } from "./twilio";
import { analyzeSkinTone, type SkinToneAnalysis } from "./openai";
import { searchProducts } from "./shopping";
import { virtualTryOn } from "./fashionApi"; // Assuming this function exists

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
      return;
    }

    switch (session.currentState) {
      case "WELCOME":
        if (message === "1") {
          const nextMessage = "Please send me a clear, well-lit selfie photo so I can analyze your skin tone and recommend suitable colors.";
          await storage.updateSession(session.id, {
            currentState: "AWAITING_PHOTO",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, nextMessage);
        } else if (message === "2") {
          const nextMessage = "For virtual try-on, I'll need two pictures:\n1. A full-body photo of yourself\n2. The garment/shirt you want to try on\n\nPlease send your full-body photo first.";
          await storage.updateSession(session.id, {
            currentState: "AWAITING_FULLBODY",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, nextMessage);
        } else if (message === "3") {
          const thankYouMessage = "Thank you for using WhatsApp Fashion Buddy! Have a great day! 👋";
          await storage.updateSession(session.id, {
            currentState: "ENDED",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, thankYouMessage);
        }
        break;

      case "AWAITING_PHOTO":
        if (!mediaUrl) {
          await sendWhatsAppMessage(phoneNumber, "Please send a selfie photo for skin tone analysis.");
          return;
        }

        try {
          // Now we analyze the photo after receiving it
          analysis = await analyzeSkinTone("", mediaUrl); // Use mediaUrl here

          // Update user's skin tone
          await storage.updateUser(user.id, {
            skinTone: analysis.tone,
            preferences: user.preferences || {}
          });

          const colorMessage = `🔍 Based on my analysis of your photo, your skin tone appears to be:
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
              recommendedColors: analysis.recommendedColors,
              lastMessage: colorMessage,
              lastOptions: ["1", "2", "3", "4"]
            }
          });

          await sendWhatsAppMessage(phoneNumber, colorMessage);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error("Error analyzing photo:", errorMessage);
          await sendWhatsAppMessage(phoneNumber, "Sorry, I couldn't analyze your photo. Please try sending another clear, well-lit selfie photo.");
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
          await sendWhatsAppMessage(phoneNumber, "Please select a valid budget range (1-3) or 4 to return to main menu");
          return;
        }

        if (!user.skinTone || !session.context?.recommendedColors) {
          await sendWhatsAppMessage(phoneNumber, "Sorry, we need to analyze your skin tone first. Please send a photo.");
          return;
        }

        try {
          // Get first three recommended colors
          const recommendedColors = session.context.recommendedColors.slice(0, 3);
          let allProducts: any[] = [];

          // Search for each recommended color
          for (const color of recommendedColors) {
            const products = await searchProducts(color, selectedBudget);
            // Take top 2 products from each color
            allProducts = [...allProducts, ...products.slice(0, 2)];
          }

          const productChunks: string[] = [];
          let currentChunk = `🛍️ Here are some recommendations in your recommended colors:\n\n`;

          for (const [index, product] of allProducts.entries()) {
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
              recommendedColors,
              currentPage: 1,
              budget: selectedBudget,
              lastOptions: ["1", "2", "3"]
            }
          });
        } catch (error) {
          console.error("Error fetching products:", error);
          await sendWhatsAppMessage(phoneNumber, "Sorry, I couldn't fetch product recommendations at the moment. Please try again.");
        }
        break;

      case "SHOWING_PRODUCTS":
        if (message === "1") {
          // Transition to virtual try-on
          const tryOnMessage = "Please send me a full-body photo to start the virtual try-on process.";
          await storage.updateSession(session.id, {
            currentState: "AWAITING_FULLBODY",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, tryOnMessage);
        } else if (message === "2") {
          // Show more options
          const context = session.context;
          if (!context?.recommendedColors || !context.budget) {
            await sendWhatsAppMessage(phoneNumber, "Sorry, I couldn't load more options. Please start over.");
            return;
          }

          // Fetch next page of products
          const nextPage = (context.currentPage || 1) + 1;
          const products = await searchProducts(context.recommendedColors[0], context.budget);

          if (products.length === 0) {
            await sendWhatsAppMessage(phoneNumber, "No more products available in this category.");
            return;
          }

          // Format and send products
          let productMessage = "Here are more recommendations:\n\n";
          products.forEach((product, index) => {
            productMessage += `${index + 1}. ${product.title}\n💰 Price: ₹${product.price}\n👕 Brand: ${product.brand}\n🔗 ${product.link}\n\n`;
          });

          productMessage += "\n1. Try these on virtually\n2. See more options\n3. Return to Main Menu";

          await sendWhatsAppMessage(phoneNumber, productMessage);
          await storage.updateSession(session.id, {
            ...session,
            context: {
              ...context,
              currentPage: nextPage
            }
          });
        } else if (message === "3") {
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);
        }
        break;

      case "AWAITING_FULLBODY":
        if (!mediaUrl) {
          await sendWhatsAppMessage(phoneNumber, "Please send your full-body photo to continue.");
          return;
        }

        try {
          // Store full-body image
          await storage.createUserImage({
            userId: user.id,
            imageUrl: mediaUrl,
            cloudinaryPublicId: 'fullbody_' + Date.now(),
            imageType: 'full_body'
          });

          const garmentMessage = "Great! I've received your full-body photo. Now please send the photo of the garment you'd like to try on.";
          await storage.updateSession(session.id, {
            currentState: "AWAITING_GARMENT",
            lastInteraction: new Date(),
            context: {
              fullBodyImage: mediaUrl
            }
          });

          await sendWhatsAppMessage(phoneNumber, garmentMessage);
        } catch (error) {
          console.error("Error processing full-body photo:", error);
          await sendWhatsAppMessage(phoneNumber, "Sorry, I couldn't process your full-body photo. Please try sending it again.");
        }
        break;

      case "AWAITING_GARMENT":
        if (!mediaUrl) {
          await sendWhatsAppMessage(phoneNumber, "Please send the garment photo to continue.");
          return;
        }

        try {
          // Store garment image without processing
          await storage.createUserImage({
            userId: user.id,
            imageUrl: mediaUrl,
            cloudinaryPublicId: 'garment_' + Date.now(),
            imageType: 'garment'
          });

          await sendWhatsAppMessage(phoneNumber, "Processing your virtual try-on request. This may take a moment...");

          // Get full body image URL from context
          const fullBodyImage = session.context?.fullBodyImage;
          if (!fullBodyImage) {
            throw new Error("Full body image not found");
          }

          // Send to Fashion API
          const tryOnResult = await virtualTryOn(fullBodyImage, mediaUrl);

          if (tryOnResult.success) {
            const tryOnResponse = `Here's how the garment would look on you!\n${tryOnResult.resultImageUrl}\n\nWould you like to:\n1. Try another garment\n2. Return to main menu`;

            await storage.updateSession(session.id, {
              currentState: "SHOWING_TRYON",
              lastInteraction: new Date(),
              context: {
                fullBodyImage,
                garmentImage: mediaUrl,
                resultImage: tryOnResult.resultImageUrl
              }
            });

            await sendWhatsAppMessage(phoneNumber, tryOnResponse);
          } else {
            throw new Error(tryOnResult.error || "Virtual try-on failed");
          }
        } catch (error) {
          console.error("Error processing virtual try-on:", error);
          await sendWhatsAppMessage(phoneNumber, "Sorry, I couldn't process the virtual try-on. Please try again with different images.");
        }
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