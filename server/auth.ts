import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { sendWhatsAppMessage } from "./lib/twilio";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "fashion-buddy-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if user with the email already exists
      const existingEmailUser = await storage.getUserByEmail(req.body.email);
      if (existingEmailUser) {
        return res.status(400).json({ error: "Email already in use" });
      }

      // Check if user with the phone number already exists
      const existingPhoneUser = await storage.getUser(req.body.phoneNumber);
      if (existingPhoneUser) {
        return res.status(400).json({ error: "Phone number already in use" });
      }

      // Hash the password
      const hashedPassword = await hashPassword(req.body.password);

      // Create new user
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      // Log user in
      req.login(user, async (err) => {
        if (err) return next(err);
        
        try {
          // Initiate WhatsApp conversation with the user
          await sendWhatsAppMessage(
            user.phoneNumber,
            `👋 Hello ${user.name}! Welcome to Fashion Buddy. I'm your AI-powered fashion assistant. How can I help you today?\n\n1. Skin tone analysis and color recommendations\n2. Virtual try-on for clothes\n3. Fashion advice\n\nJust reply with what you're looking for!`
          );
          
          // Initialize session
          await storage.createSession({
            userId: user.id,
            currentState: "GREETING",
            lastInteraction: new Date(),
            context: {}
          });
          
          res.status(201).json(user);
        } catch (error) {
          console.error("Error sending welcome WhatsApp message:", error);
          res.status(201).json(user); // Still return success even if WhatsApp fails
        }
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    res.json(req.user);
  });

  // Password reset endpoint
  app.post("/api/reset-password", async (req, res, next) => {
    try {
      const { email, newPassword } = req.body;
      
      if (!email || !newPassword) {
        return res.status(400).json({ error: "Email and new password are required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user with new password
      const updatedUser = await storage.updateUser(user.id, {
        password: hashedPassword
      });
      
      res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      next(error);
    }
  });
}