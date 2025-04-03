import type { Express } from "express";
import { createServer, type Server } from "http";
import { validateTwilioRequest, sendWhatsAppMessage } from "./lib/twilio";
import { handleIncomingMessage } from "./lib/messageHandler";
import { storage } from "./storage";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  // Stats endpoint for dashboard
  app.get("/api/stats", async (_req, res) => {
    try {
      // Get all users and sessions from storage instance
      const stats = {
        activeUsers: await storage.getUserCount(),
        messagesToday: await storage.getRecentSessionCount(24),
        recommendations: await storage.getProductRecommendationCount(),
      };

      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Endpoint to start a new chat
  app.post("/api/start-chat", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { name, phoneNumber } = req.body;
      const authenticatedUser = req.user;

      // Get user by ID to ensure we're working with the authenticated user
      const user = await storage.getUserById(authenticatedUser.id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check subscription limits for color analysis and virtual try-on
      const isFree = user.subscriptionTier === 'free';
      const isColorLimitReached = isFree && user.colorAnalysisCount >= 1;
      const isTryOnLimitReached = isFree && user.virtualTryOnCount >= 1;
      
      if (isColorLimitReached && isTryOnLimitReached) {
        const upgradeMessage = `It looks like you've reached your free plan limits. Upgrade to Premium for unlimited color analyses and virtual try-ons!`;
        await sendWhatsAppMessage(user.phoneNumber, upgradeMessage);
      }

      // Send welcome message when chat is triggered from dashboard
      const onboardingMessage = `Hello ${user.name}! 👋 Welcome to WhatsApp Fashion Buddy! 
I can help you find clothes that match your skin tone or try on clothes virtually. 
What would you like to do today?

1. Color Analysis & Shopping Recommendations
2. Virtual Try-On
3. End Chat`;

      await sendWhatsAppMessage(user.phoneNumber, onboardingMessage);

      // Create new session
      const session = await storage.createSession({
        userId: user.id,
        currentState: "WELCOME",
        lastInteraction: new Date(),
        context: {
          lastMessage: onboardingMessage,
          lastOptions: ["1", "2", "3"]
        }
      });

      // Store onboarding message in conversations
      await storage.createConversation({
        userId: user.id,
        sessionId: session.id,
        message: onboardingMessage,
        messageType: 'system'
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Start chat error:", error);
      res.status(500).json({ error: "Failed to start chat" });
    }
  });

  // Test endpoint to verify webhook URL is accessible
  app.get("/api/webhook", (_req, res) => {
    res.status(200).send("Webhook endpoint is active. Please use POST for Twilio WhatsApp messages.");
  });
  
  // For testing: Simulate a WhatsApp message
  app.post("/api/test-whatsapp", async (req, res) => {
    try {
      const { phoneNumber, message, mediaUrl } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      
      console.log("Simulating WhatsApp message:", {
        from: `whatsapp:${phoneNumber}`,
        body: message || "1", // Default to "1" if no message provided
        mediaUrl: mediaUrl || null
      });
      
      await handleIncomingMessage(`whatsapp:${phoneNumber}`, message || "1", mediaUrl);
      res.json({ success: true });
    } catch (error) {
      console.error("Test WhatsApp error:", error);
      res.status(500).json({ error: "Failed to simulate WhatsApp message" });
    }
  });

  // Twilio webhook for incoming WhatsApp messages
  app.post("/api/webhook", async (req, res) => {
    try {
      // Log incoming request details
      console.log("Webhook received:", {
        headers: req.headers,
        body: req.body,
        url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
        method: req.method
      });

      // Validate request is from Twilio
      const twilioSignature = req.headers["x-twilio-signature"] as string;
      const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

      console.log("Validating Twilio request:", {
        signature: twilioSignature,
        url,
        hasBody: !!req.body
      });
      
      // For testing, temporarily bypass signature validation to ensure webhooks are processed
      // This should be removed in production for security
      const isValidRequest = process.env.NODE_ENV === "development" || validateTwilioRequest(twilioSignature, url, req.body);
      
      if (!isValidRequest) {
        console.error("Invalid Twilio signature");
        return res.status(401).send("Invalid signature");
      }

      const { From, Body, MediaUrl0 } = req.body;

      console.log("Processing WhatsApp message:", {
        from: From,
        body: Body,
        mediaUrl: MediaUrl0,
        allParams: req.body
      });

      await handleIncomingMessage(From, Body, MediaUrl0);

      // Send TwiML response
      res.set('Content-Type', 'text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
    } catch (error) {
      console.error("Webhook error:", error);
      // Still send a valid TwiML response even on error
      res.set('Content-Type', 'text/xml');
      res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}