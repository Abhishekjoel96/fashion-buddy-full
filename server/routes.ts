import type { Express } from "express";
import { createServer, type Server } from "http";
import { validateTwilioRequest } from "./lib/twilio";
import { handleIncomingMessage } from "./lib/messageHandler";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Stats endpoint for dashboard
  app.get("/api/stats", async (_req, res) => {
    try {
      // Get all users and sessions
      const users = Array.from(storage.users.values());
      const sessions = Array.from(storage.sessions.values());

      // Calculate stats
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const stats = {
        activeUsers: users.length,
        messagesToday: sessions.filter(session => 
          session.lastInteraction > oneDayAgo
        ).length,
        recommendations: sessions.filter(session => 
          session.currentState === "SHOWING_PRODUCTS"
        ).length,
      };

      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to get stats" });
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