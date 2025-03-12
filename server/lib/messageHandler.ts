import { storage } from "../storage";
import { sendWhatsAppMessage, fetchTwilioMedia } from "./twilio";
import { analyzeSkinTone, type SkinToneAnalysis } from "./openai";
import { searchProducts } from "./shopping";
import { addConversationEntry } from "./db";
import { virtualTryOn } from "./virtualTryOn";

const MAIN_MENU = `📱 WhatsApp Fashion Buddy - Main Menu:

1. Color Analysis & Shopping Recommendations
2. Virtual Try-On
3. End Chat`;

const WELCOME_MESSAGE = `👋 Hello! Welcome to WhatsApp Fashion Buddy! 
I can help you find clothes that match your skin tone or try on clothes virtually. 
What would you like to do today?

${MAIN_MENU}`;

const THANK_YOU_MESSAGE = `Thank you for using WhatsApp Fashion Buddy! We hope you enjoyed your experience. 
Feel free to come back anytime you need fashion advice or want to try on new clothes virtually. 
Have a great day! 👋`;

export async function handleIncomingMessage(
  from: string,
  message: string,
  mediaUrl?: string,
  twilioDetails?: {
    mediaContentType?: string;
    messageType?: string;
    requestBody?: any;
  }
): Promise<void> {
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

    // Store conversation history
    await addConversationEntry(phoneNumber, {
      timestamp: new Date(),
      from: 'user',
      message,
      mediaUrl
    });

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

          const responseMsg = "Great! Let's start by understanding your skin tone. Please send a clear, well-lit selfie of your face.";
          await sendWhatsAppMessage(phoneNumber, responseMsg);

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: responseMsg
          });
        } else if (message === "2") {
          await storage.updateSession(session.id, {
            currentState: "AWAITING_FULL_BODY_PHOTO",
            lastInteraction: new Date(),
            context: {
              lastMessage: "Please send a full-body photo for virtual try-on.",
              lastOptions: [],
              analyzedImage: undefined
            }
          });

          const responseMsg = "Great! For virtual try-on, I'll need a full-body photo of you. Please send a clear, well-lit full-body photo.";
          await sendWhatsAppMessage(phoneNumber, responseMsg);

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: responseMsg
          });
        } else if (message === "3") {
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });

          await sendWhatsAppMessage(phoneNumber, THANK_YOU_MESSAGE);

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: THANK_YOU_MESSAGE
          });
        } else {
          await sendWhatsAppMessage(
            phoneNumber,
            "Please select a valid option (1-3):\n\n" + MAIN_MENU
          );

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: "Please select a valid option (1-3):\n\n" + MAIN_MENU
          });
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
          // Use the fetchTwilioMedia function with enhanced error handling
          console.log(`Fetching image with authentication: ${mediaUrl}`);
          const { buffer: imageBuffer, contentType } = await fetchTwilioMedia(mediaUrl);
          const base64Image = imageBuffer.toString("base64");

          console.log(`Successfully fetched image: ${mediaUrl}`);
          console.log(`Image details: content-type: ${contentType}, size: ${imageBuffer.byteLength} bytes`);
          console.log(`Message type: ${message ? 'Text message' : 'Image only'}, Media type from Twilio: ${twilioDetails?.messageType || 'unknown'}`);

          // Attempt skin tone analysis with enhanced error handling
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

        await addConversationEntry(phoneNumber, {
          timestamp: new Date(),
          from: 'bot',
          message: colorMessage
        });
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
          (user.skinTone ? [user.skinTone] : ["blue", "black"]);

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

        productMessage += "What would you like to do next?\n\n1. Try on these clothes virtually\n2. See more options\n3. Back to main menu";

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

        await addConversationEntry(phoneNumber, {
          timestamp: new Date(),
          from: 'bot',
          message: productMessage
        });
        break;

      case "SHOWING_PRODUCTS":
        if (message === "1") {
          await storage.updateSession(session.id, {
            currentState: "AWAITING_FULL_BODY_PHOTO",
            lastInteraction: new Date(),
            context: {
              lastMessage: "Please send a full-body photo for virtual try-on.",
              lastOptions: [],
              analyzedImage: session.context?.analyzedImage
            }
          });

          const tryOnMsg = "Great! For virtual try-on, I'll need a full-body photo. Please send a clear, well-lit full-body photo.";
          await sendWhatsAppMessage(phoneNumber, tryOnMsg);

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: tryOnMsg
          });
        } else if (message === "2") {
          // Show more options logic - reuse the existing flow
          if (!user.skinTone) {
            await sendWhatsAppMessage(
              phoneNumber,
              "Sorry, we need to analyze your skin tone first. Please send a photo."
            );
            return;
          }

          // Extract recommended colors with fallback
          const moreRecommendedColors = analysis?.recommendedColors || 
            (user.skinTone ? [user.skinTone] : ["blue", "black"]);

          // Get the budget from current session
          const currentBudget = session.context?.lastOptions?.includes("1") ? "500-1500" :
                               session.context?.lastOptions?.includes("2") ? "1500-3000" : "3000-10000";

          // Search for more products with different sort/filter
          const moreProducts = await searchProducts(
            moreRecommendedColors,
            currentBudget,
            true // Flag to get different products
          );

          let moreProductsMessage = "🌟 Here are some more clothing options that match your skin tone:\n\n";
          moreProducts.forEach((product, index) => {
            moreProductsMessage += `${index + 1}. ${product.title}
   💰 ₹${product.price}
   👕 Brand: ${product.brand}
   🔗 ${product.link}\n\n`;
          });

          moreProductsMessage += "What would you like to do next?\n\n1. Try on these clothes virtually\n2. Back to main menu";

          await storage.updateSession(session.id, {
            currentState: "SHOWING_MORE_PRODUCTS",
            lastInteraction: new Date(),
            context: {
              lastMessage: moreProductsMessage,
              lastOptions: ["1", "2"],
              analyzedImage: session.context?.analyzedImage
            }
          });

          await sendWhatsAppMessage(phoneNumber, moreProductsMessage);

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: moreProductsMessage
          });
        } else if (message === "3") {
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });

          await sendWhatsAppMessage(phoneNumber, MAIN_MENU);

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: MAIN_MENU
          });
        } else {
          await sendWhatsAppMessage(
            phoneNumber,
            "Please select a valid option (1-3)"
          );
        }
        break;

      case "SHOWING_MORE_PRODUCTS":
        if (message === "1") {
          await storage.updateSession(session.id, {
            currentState: "AWAITING_FULL_BODY_PHOTO",
            lastInteraction: new Date(),
            context: {
              lastMessage: "Please send a full-body photo for virtual try-on.",
              lastOptions: [],
              analyzedImage: session.context?.analyzedImage
            }
          });

          const tryOnMsg = "Great! For virtual try-on, I'll need a full-body photo. Please send a clear, well-lit full-body photo.";
          await sendWhatsAppMessage(phoneNumber, tryOnMsg);

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: tryOnMsg
          });
        } else if (message === "2") {
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });

          await sendWhatsAppMessage(phoneNumber, MAIN_MENU);

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: MAIN_MENU
          });
        } else {
          await sendWhatsAppMessage(
            phoneNumber,
            "Please select a valid option (1-2)"
          );
        }
        break;

      case "AWAITING_FULL_BODY_PHOTO":
        if (!mediaUrl) {
          await sendWhatsAppMessage(
            phoneNumber,
            "Please send a full-body photo for virtual try-on."
          );
          return;
        }

        try {
          // Fetch and process the full-body image
          const { buffer: bodyImageBuffer, contentType } = await fetchTwilioMedia(mediaUrl);
          const base64BodyImage = bodyImageBuffer.toString("base64");

          console.log(`Successfully fetched full-body image: ${mediaUrl}`);
          console.log(`Image details: content-type: ${contentType}, size: ${bodyImageBuffer.byteLength} bytes`);

          await storage.updateSession(session.id, {
            currentState: "AWAITING_GARMENT_SELECTION",
            lastInteraction: new Date(),
            context: {
              lastMessage: "Which garment would you like to try on?",
              lastOptions: [],
              analyzedImage: base64BodyImage
            }
          });

          const garmentMsg = "Great photo! Now, tell me which shirt or t-shirt you'd like to try on. You can:\n\n" +
                            "1. Describe the type of shirt (e.g., 'a blue formal shirt')\n" +
                            "2. Paste a link to a specific product\n" +
                            "3. Choose from our recommended items";

          await sendWhatsAppMessage(phoneNumber, garmentMsg);

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: garmentMsg
          });
        } catch (error) {
          console.error("Full-body image processing error:", error);

          let errorMessage = "I had trouble processing your full-body photo. ";

          if (error instanceof Error) {
            if (error.message.includes("timeout") || error.message.includes("timed out")) {
              errorMessage += "The processing took too long to complete. ";
            } else if (error.message.includes("format") || error.message.includes("invalid")) {
              errorMessage += "The image format couldn't be processed. ";
            }
          }

          errorMessage += "Please try again with a clear full-body photo in good lighting.";

          await sendWhatsAppMessage(phoneNumber, errorMessage);
          return;
        }
        break;

      case "AWAITING_GARMENT_SELECTION":
        // Process the garment selection (text description, link, or choice)
        try {
          // Store the garment choice
          await storage.updateSession(session.id, {
            currentState: "PROCESSING_VIRTUAL_TRYON",
            lastInteraction: new Date(),
            context: {
              lastMessage: `Processing your virtual try-on with: ${message}`,
              lastOptions: [],
              analyzedImage: session.context?.analyzedImage,
              garmentChoice: message
            }
          });

          // Let the user know we're processing
          await sendWhatsAppMessage(
            phoneNumber,
            "🔄 Processing your virtual try-on request. This may take a moment..."
          );

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: "🔄 Processing your virtual try-on request. This may take a moment..."
          });

          // Process the virtual try-on
          const bodyImage = session.context?.analyzedImage;
          if (!bodyImage) {
            throw new Error("Body image not found");
          }

          const resultImageBase64 = await virtualTryOn(bodyImage, message);

          // Update session state
          await storage.updateSession(session.id, {
            currentState: "SHOWING_VIRTUAL_TRYON",
            lastInteraction: new Date(),
            context: {
              lastMessage: "Here's your virtual try-on result!",
              lastOptions: [],
              analyzedImage: bodyImage,
              tryOnResult: resultImageBase64
            }
          });

          // Send the result image back to the user
          await sendWhatsAppMessage(
            phoneNumber,
            "✨ Here's how you look with the selected garment! What would you like to do next?\n\n" +
            "1. Try on another garment\n" +
            "2. Back to main menu\n" +
            "3. End chat",
            resultImageBase64
          );

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: "✨ Here's how you look with the selected garment! What would you like to do next?",
            mediaUrl: "virtual-try-on-result"
          });
        } catch (error) {
          console.error("Virtual try-on error:", error);

          await sendWhatsAppMessage(
            phoneNumber,
            "I'm sorry, I couldn't process your virtual try-on request. Please try again with a different garment or photo.\n\n" +
            "What would you like to do?\n\n" +
            "1. Try again\n" +
            "2. Back to main menu"
          );

          await storage.updateSession(session.id, {
            currentState: "VIRTUAL_TRYON_ERROR",
            lastInteraction: new Date(),
            context: {
              lastMessage: "Virtual try-on error",
              lastOptions: ["1", "2"],
              analyzedImage: session.context?.analyzedImage
            }
          });
        }
        break;

      case "SHOWING_VIRTUAL_TRYON":
        if (message === "1") {
          await storage.updateSession(session.id, {
            currentState: "AWAITING_GARMENT_SELECTION",
            lastInteraction: new Date(),
            context: {
              lastMessage: "Which garment would you like to try on?",
              lastOptions: [],
              analyzedImage: session.context?.analyzedImage
            }
          });

          const garmentMsg = "Please tell me which shirt or t-shirt you'd like to try on. You can:\n\n" +
                           "1. Describe the type of shirt (e.g., 'a blue formal shirt')\n" +
                           "2. Paste a link to a specific product\n" +
                           "3. Choose from our recommended items";

          await sendWhatsAppMessage(phoneNumber, garmentMsg);

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: garmentMsg
          });
        } else if (message === "2") {
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });

          await sendWhatsAppMessage(phoneNumber, MAIN_MENU);

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: MAIN_MENU
          });
        } else if (message === "3") {
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });

          await sendWhatsAppMessage(phoneNumber, THANK_YOU_MESSAGE);

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: THANK_YOU_MESSAGE
          });
        } else {
          await sendWhatsAppMessage(
            phoneNumber,
            "Please select a valid option (1-3)"
          );
        }
        break;

      case "VIRTUAL_TRYON_ERROR":
        if (message === "1") {
          await storage.updateSession(session.id, {
            currentState: "AWAITING_FULL_BODY_PHOTO",
            lastInteraction: new Date(),
            context: {
              lastMessage: "Please send a full-body photo for virtual try-on.",
              lastOptions: [],
              analyzedImage: undefined
            }
          });

          const tryOnMsg = "Let's try again. Please send a clear, well-lit full-body photo.";
          await sendWhatsAppMessage(phoneNumber, tryOnMsg);

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: tryOnMsg
          });
        } else if (message === "2") {
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });

          await sendWhatsAppMessage(phoneNumber, MAIN_MENU);

          await addConversationEntry(phoneNumber, {
            timestamp: new Date(),
            from: 'bot',
            message: MAIN_MENU
          });
        } else {
          await sendWhatsAppMessage(
            phoneNumber,
            "Please select a valid option (1-2)"
          );
        }
        break;

      default:
        await storage.updateSession(session.id, {
          currentState: "WELCOME",
          lastInteraction: new Date(),
          context: null
        });
        await sendWhatsAppMessage(phoneNumber, MAIN_MENU);

        await addConversationEntry(phoneNumber, {
          timestamp: new Date(),
          from: 'bot',
          message: MAIN_MENU
        });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error handling message: ${errorMessage}`, error);
    throw new Error(`Error handling message: ${errorMessage}`);
  }
}