import { storage } from "../storage";
import { sendWhatsAppMessage } from "./twilio";
import { analyzeSkinTone, type SkinToneAnalysis } from "./openai";
import { searchProducts } from "./shopping";
import { virtualTryOn } from "./fashionApi";
import { uploadImageToCloudinary } from "./cloudinary";

const WELCOME_MESSAGE = `Welcome to WhatsApp Fashion Buddy! 
I can help you find clothes that match your skin tone or try on clothes virtually. 
What would you like to do today?

1. Color Analysis & Shopping Recommendations
2. Virtual Try-On
3. End Chat`;

const ONBOARDING_MESSAGE = `👋 Welcome to Fashion Buddy! I'm your AI fashion assistant.

Here's how I can help you:
• Analyze your skin tone to find perfect color matches
• Show how clothes would look on you with virtual try-on
• Find shopping recommendations from top Indian stores

Let's get started with a quick guide:

1. Continue with Onboarding
2. Skip to Main Menu`;

const FEATURES_EXPLANATION = `🌈 *Color Analysis*
Send me a selfie, and I'll analyze your skin tone to suggest colors that complement you perfectly!
• Free tier: 1 analysis/month, 3 recommended colors
• Premium tier: 10 analyses/month, 5 recommended colors + colors to avoid

👕 *Virtual Try-On*
Send a full-body photo and a garment image to see how clothes look on you without physically trying them on.
• Free tier: 1 try-on/month
• Premium tier: 10 try-ons/month, priority processing

🛍️ *Shopping Recommendations*
I'll find clothing items from Indian stores like Myntra and Flipkart that match your skin tone and preferences.
• Free tier: Limited catalog access
• Premium tier: Full catalog access, priority support

💎 *Premium Subscription*
Upgrade to Premium for just ₹129/month to unlock all features!

Choose an option:
1. Start with Color Analysis
2. Try Virtual Try-On
3. Return to Main Menu`;

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
      // First-time user - start with onboarding flow
      session = await storage.createSession({
        userId: user.id,
        currentState: "ONBOARDING",
        lastInteraction: new Date(),
        context: {
          isNewUser: true,
          subscriptionTier: user.subscriptionTier
        }
      });
      await sendWhatsAppMessage(phoneNumber, ONBOARDING_MESSAGE);
      return;
    }

    switch (session.currentState) {
      case "ONBOARDING":
        if (message === "1") {
          // Continue with onboarding flow
          await storage.updateSession(session.id, {
            currentState: "FEATURES_EXPLANATION",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, FEATURES_EXPLANATION);
        } else if (message === "2") {
          // Skip to main menu
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);
        } else {
          await sendWhatsAppMessage(
            phoneNumber,
            "Please select a valid option (1 or 2)."
          );
        }
        break;
        
      case "FEATURES_EXPLANATION":
        if (message === "1") {
          // Go to color analysis
          const nextMessage = "Please send me a clear, well-lit selfie photo so I can analyze your skin tone and recommend suitable colors.";
          await storage.updateSession(session.id, {
            currentState: "AWAITING_PHOTO",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, nextMessage);
        } else if (message === "2") {
          // Go to virtual try-on
          const nextMessage = "For virtual try-on, I'll need two pictures:\n1. A full-body photo of yourself\n2. The garment/shirt you want to try on\n\nPlease send your full-body photo first.";
          await storage.updateSession(session.id, {
            currentState: "AWAITING_FULLBODY",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, nextMessage);
        } else if (message === "3") {
          // Go to main menu
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);
        } else {
          await sendWhatsAppMessage(
            phoneNumber,
            "Please select a valid option (1, 2, or 3)."
          );
        }
        break;
        
      case "SUBSCRIPTION_PROMPT":
        if (message === "1") {
          // Handle upgrade request
          const upgradeResponse = `Thank you for your interest in upgrading to Premium! 
          
To complete the upgrade process, please go to our website dashboard and select the Premium plan option. You'll be able to make the payment securely there.

In the meantime, I'll return you to the main menu.`;
          
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });
          
          await sendWhatsAppMessage(phoneNumber, upgradeResponse);
          await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);
        } else if (message === "2") {
          // Return to main menu
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);
        } else {
          await sendWhatsAppMessage(
            phoneNumber,
            "Please select a valid option (1 or 2)."
          );
        }
        break;
        
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
          // Check if user has reached their color analysis limit
          if (user.subscriptionTier === 'free' && user.colorAnalysisCount >= 1) {
            const upgradeMessage = `You've reached your monthly limit for free color analyses. 

Would you like to upgrade to Premium for ₹129/month and enjoy:
- 10 color analyses per month
- 5 recommended colors (vs. 3 for free)
- List of colors to avoid
- 10 virtual try-ons per month (vs. 1 for free)
- Access to our full catalog
- Priority support

1. Upgrade to Premium
2. Return to Main Menu`;

            await storage.updateSession(session.id, {
              currentState: "SUBSCRIPTION_PROMPT",
              lastInteraction: new Date(),
              context: {
                subscriptionPrompted: true,
                lastOptions: ["1", "2"]
              }
            });

            await sendWhatsAppMessage(phoneNumber, upgradeMessage);
            return;
          }

          // Now we analyze the photo after receiving it
          analysis = await analyzeSkinTone("", mediaUrl); // Use mediaUrl here
          
          // Increment the color analysis count
          await storage.incrementColorAnalysisCount(user.id);

          // Update user's skin tone
          await storage.updateUser(user.id, {
            skinTone: analysis.tone,
            preferences: user.preferences || {}
          });

          // For free tier, limit to 3 colors and no colors to avoid
          let recommendedColors = analysis.recommendedColors;
          let colorsToAvoid = analysis.colorsToAvoid;
          
          if (user.subscriptionTier === 'free') {
            recommendedColors = recommendedColors.slice(0, 3);
            colorsToAvoid = []; // No colors to avoid for free tier
          }

          let colorMessage = `🔍 Based on my analysis of your photo, your skin tone appears to be:
Skin Tone: ${analysis.tone}
Undertone: ${analysis.undertone}

Recommended Colors: 
${recommendedColors.join(", ")}`;

          // Only show colors to avoid for premium users
          if (user.subscriptionTier === 'premium' && colorsToAvoid.length > 0) {
            colorMessage += `\n\nColors to Avoid:
${colorsToAvoid.join(", ")}`;
          }

          colorMessage += `\n\nWould you like to see clothing recommendations in these colors?
1. Budget Range ₹500-₹1500
2. Budget Range ₹1500-₹3000
3. Budget Range ₹3000+
4. Return to Main Menu`;

          await storage.updateSession(session.id, {
            currentState: "AWAITING_BUDGET",
            lastInteraction: new Date(),
            context: {
              recommendedColors: recommendedColors,
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

            console.log("Fetching products for colors:", recommendedColors);

            // Search for each recommended color
            for (const color of recommendedColors) {
              try {
                const products = await searchProducts(color, selectedBudget);
                // Take top 2 products from each color
                allProducts = [...allProducts, ...products.slice(0, 2)];
                console.log(`Found ${products.length} products for color ${color}`);
              } catch (error) {
                console.error(`Error fetching products for color ${color}:`, error);
                // Continue with other colors if one fails
                continue;
              }
            }

            if (allProducts.length === 0) {
              throw new Error("No products found for any of the recommended colors");
            }

            const productChunks: string[] = [];
            let currentChunk = `🛍️ Here are some recommendations in your recommended colors:\n\n`;

            // Use forEach with index instead of entries() to avoid TypeScript issues
            allProducts.forEach((product, index) => {
              const productText = `${index + 1}. ${product.title}\n💰 Price: ₹${product.price}\n👕 Brand: ${product.brand}\n🏪 From: ${product.source}\n${product.description ? `📝 ${product.description}\n` : ''}🔗 ${product.link}\n\n`;

              if ((currentChunk + productText).length > 1500) {
                productChunks.push(currentChunk.trim());
                currentChunk = `Continued...\n\n${productText}`;
              } else {
                currentChunk += productText;
              }
            });

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
            await sendWhatsAppMessage(phoneNumber, "Sorry, I couldn't fetch product recommendations at the moment. Please try again later.");

            // Return to welcome state on error
            await storage.updateSession(session.id, {
              currentState: "WELCOME",
              lastInteraction: new Date(),
              context: null
            });
            await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);
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
          // Upload full-body image to Cloudinary first
          const uploadResult = await uploadImageToCloudinary(mediaUrl, user.id, 'full_body');

          // Store image info in database
          await storage.createUserImage({
            userId: user.id,
            imageUrl: uploadResult.imageUrl,
            cloudinaryPublicId: uploadResult.publicId,
            imageType: 'full_body'
          });

          const garmentMessage = "Great! I've received your full-body photo. Now please send the photo of the garment you'd like to try on.";
          await storage.updateSession(session.id, {
            currentState: "AWAITING_GARMENT",
            lastInteraction: new Date(),
            context: {
              fullBodyImage: uploadResult.imageUrl // Store Cloudinary URL instead of Twilio URL
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
          // Check if user has reached their virtual try-on limit
          if (user.subscriptionTier === 'free' && user.virtualTryOnCount >= 1) {
            const upgradeMessage = `You've reached your monthly limit for free virtual try-ons. 

Would you like to upgrade to Premium for ₹129/month and enjoy:
- 10 color analyses per month
- 5 recommended colors (vs. 3 for free)
- List of colors to avoid
- 10 virtual try-ons per month (vs. 1 for free)
- Access to our full catalog
- Priority support

1. Upgrade to Premium
2. Return to Main Menu`;

            await storage.updateSession(session.id, {
              currentState: "SUBSCRIPTION_PROMPT",
              lastInteraction: new Date(),
              context: {
                subscriptionPrompted: true,
                lastOptions: ["1", "2"]
              }
            });

            await sendWhatsAppMessage(phoneNumber, upgradeMessage);
            return;
          }
          
          // Upload garment image to Cloudinary
          const uploadResult = await uploadImageToCloudinary(mediaUrl, user.id, 'garment');

          // Store garment image in database
          await storage.createUserImage({
            userId: user.id,
            imageUrl: uploadResult.imageUrl,
            cloudinaryPublicId: uploadResult.publicId,
            imageType: 'garment'
          });

          await sendWhatsAppMessage(phoneNumber, "Processing your virtual try-on request. This may take a moment...");

          // Get full body image URL from context
          const fullBodyImage = session.context?.fullBodyImage;
          if (!fullBodyImage) {
            throw new Error("Full body image not found");
          }

          // Send process update message
          await sendWhatsAppMessage(phoneNumber, "🔄 Processing your virtual try-on request. This may take up to 30 seconds...");
          
          // Send Cloudinary URLs to Fashion API
          try {
            const tryOnResult = await virtualTryOn(fullBodyImage, uploadResult.imageUrl);
            
            if (tryOnResult.success) {
              // Increment virtual try-on count
              await storage.incrementVirtualTryOnCount(user.id);
              
              const tryOnResponse = `✨ Here's how the garment would look on you!\n${tryOnResult.resultImageUrl}\n\nWould you like to:\n1. Try another garment\n2. Return to main menu`;
  
              await storage.updateSession(session.id, {
                currentState: "SHOWING_TRYON",
                lastInteraction: new Date(),
                context: {
                  fullBodyImage,
                  garmentImage: uploadResult.imageUrl,
                  resultImage: tryOnResult.resultImageUrl
                }
              });
  
              await sendWhatsAppMessage(phoneNumber, tryOnResponse);
            } else {
              // Handle API error with specific feedback
              let errorMessage = "Sorry, I couldn't process the virtual try-on.";
              
              if (tryOnResult.error) {
                if (tryOnResult.error.includes("timeout")) {
                  errorMessage = "The process took too long to complete. This might be due to high demand. Please try again in a few minutes.";
                } else if (tryOnResult.error.includes("image") || tryOnResult.error.includes("detect")) {
                  errorMessage = "I had trouble processing the images. Please make sure:\n- Your full-body photo shows your entire body clearly\n- The garment photo shows the clothing item clearly on a simple background\n- Both images have good lighting and resolution";
                } else {
                  errorMessage = `There was an issue with the virtual try-on: ${tryOnResult.error}`;
                }
              }
              
              await sendWhatsAppMessage(phoneNumber, errorMessage);
              await sendWhatsAppMessage(phoneNumber, "Would you like to:\n1. Try again with different images\n2. Return to main menu");
              
              await storage.updateSession(session.id, {
                currentState: "VIRTUAL_TRYON_ERROR",
                lastInteraction: new Date(),
                context: {
                  fullBodyImage,
                  lastOptions: ["1", "2"]
                }
              });
            }
          } catch (error) {
            console.error("Error processing virtual try-on:", error);
            await sendWhatsAppMessage(phoneNumber, "Sorry, I couldn't process the virtual try-on due to a technical issue. Please try again later.");
            
            // Return to welcome state on error
            await storage.updateSession(session.id, {
              currentState: "WELCOME",
              lastInteraction: new Date(),
              context: null
            });
            await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);
          }
        } catch (error) {
          console.error("Error uploading garment image:", error);
          await sendWhatsAppMessage(phoneNumber, "Sorry, I couldn't process the garment image. Please try sending it again.");
        }
        break;

      case "VIRTUAL_TRYON_ERROR":
        if (message === "1") {
          // Try again with different images, but keep the full body photo
          const retryMessage = "Let's try again! Please send another garment photo to try on.";
          await storage.updateSession(session.id, {
            currentState: "AWAITING_GARMENT",
            lastInteraction: new Date(),
            context: {
              fullBodyImage: session.context?.fullBodyImage
            }
          });
          await sendWhatsAppMessage(phoneNumber, retryMessage);
        } else if (message === "2") {
          // Return to main menu
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);
        } else {
          await sendWhatsAppMessage(
            phoneNumber,
            "Please select a valid option (1 or 2)."
          );
        }
        break;
        
      case "SHOWING_TRYON":
        if (message === "1") {
          // Check if user has reached their virtual try-on limit
          if (user.subscriptionTier === 'free' && user.virtualTryOnCount >= 1) {
            const upgradeMessage = `You've reached your monthly limit for free virtual try-ons. 

Would you like to upgrade to Premium for ₹129/month and enjoy:
- 10 color analyses per month
- 5 recommended colors (vs. 3 for free)
- List of colors to avoid
- 10 virtual try-ons per month (vs. 1 for free)
- Access to our full catalog
- Priority support

1. Upgrade to Premium
2. Return to Main Menu`;

            await storage.updateSession(session.id, {
              currentState: "SUBSCRIPTION_PROMPT",
              lastInteraction: new Date(),
              context: {
                subscriptionPrompted: true,
                lastOptions: ["1", "2"]
              }
            });

            await sendWhatsAppMessage(phoneNumber, upgradeMessage);
            return;
          }
          
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
        
      case "SUBSCRIPTION_PROMPT":
        if (message === "1") {
          // Handle upgrade to premium
          // In a real implementation, this would redirect to a payment link
          // For now, we'll just simulate the upgrade
          
          // Set user to premium tier
          const oneMonthFromNow = new Date();
          oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
          
          await storage.updateUserSubscription(user.id, {
            subscriptionTier: 'premium',
            subscriptionExpiresAt: oneMonthFromNow
          });
          
          // Confirm the subscription
          const subscriptionMessage = `🎉 Congratulations! You've been upgraded to Premium tier.
          
Your subscription includes:
- 10 color analyses per month
- 5 recommended colors with undertone analysis
- List of colors to avoid
- 10 virtual try-ons per month
- Full catalog access
- Priority support

Your subscription is valid until ${oneMonthFromNow.toLocaleDateString()}.

What would you like to do now?
1. Color Analysis & Shopping
2. Virtual Try-On`;
          
          await storage.updateSession(session.id, {
            currentState: "WELCOME",
            lastInteraction: new Date(),
            context: {
              lastMessage: subscriptionMessage,
              lastOptions: ["1", "2"]
            }
          });
          
          await sendWhatsAppMessage(phoneNumber, subscriptionMessage);
        } else if (message === "2") {
          // Return to main menu
          await storage.updateSession(session.id, {
            currentState: "WELCOME", 
            lastInteraction: new Date(),
            context: null
          });
          await sendWhatsAppMessage(phoneNumber, WELCOME_MESSAGE);
        } else {
          await sendWhatsAppMessage(phoneNumber, "Please select option 1 to upgrade or 2 to return to the main menu.");
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