import type { Express } from "express";
import { createServer, type Server } from "http";
import { validateTwilioRequest, sendWhatsAppMessage } from "./lib/twilio";
import { handleIncomingMessage } from "./lib/messageHandler";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
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
    try {
      const { name, phoneNumber } = req.body;

      // Create or get user
      let user = await storage.getUser(phoneNumber);
      if (!user) {
        user = await storage.createUser({
          phoneNumber,
          skinTone: null,
          preferences: null
        });
      }

      // Send welcome message with user's name
      const welcomeMessage = `Hello ${name}! 👋 Welcome to WhatsApp Fashion Buddy! 
I can help you find clothes that match your skin tone or try on clothes virtually. 
What would you like to do today?

1. Color Analysis & Shopping Recommendations
2. Virtual Try-On`;

      await sendWhatsAppMessage(phoneNumber, welcomeMessage);

      // Create new session
      await storage.createSession({
        userId: user.id,
        currentState: "WELCOME",
        lastInteraction: new Date(),
        context: null
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Start chat error:", error);
      res.status(500).json({ error: "Failed to start chat" });
    }
  });

  // Twilio webhook for incoming WhatsApp messages
  app.post("/api/webhook", async (req, res) => {
    try {
      // Validate request is from Twilio
      const twilioSignature = req.headers["x-twilio-signature"] as string;
      const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

      if (!validateTwilioRequest(twilioSignature, url, req.body)) {
        return res.status(401).send("Invalid signature");
      }

      const { From, Body, MediaUrl0 } = req.body;

      await handleIncomingMessage(From, Body, MediaUrl0);

      res.status(200).send();
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}