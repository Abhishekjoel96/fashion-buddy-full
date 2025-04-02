import { pgTable, text, serial, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  skinTone: text("skin_tone"),
  preferences: json("preferences").$type<{
    budget?: string;
    style?: string[];
    sizes?: string[];
  }>(),
  subscriptionTier: text("subscription_tier").default("free").notNull(), // 'free' or 'premium'
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  colorAnalysisCount: integer("color_analysis_count").default(0).notNull(),
  virtualTryOnCount: integer("virtual_try_on_count").default(0).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userImages = pgTable("user_images", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  cloudinaryPublicId: text("cloudinary_public_id").notNull(),
  imageType: text("image_type").notNull(), // 'selfie' or 'full_body' or 'garment'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  currentState: text("current_state").notNull(),
  lastInteraction: timestamp("last_interaction").notNull(),
  context: json("context").$type<{
    lastMessage?: string;
    lastOptions?: string[];
    analyzedImage?: string;
    fullBodyImage?: string;
    garmentImage?: string;
    recommendedColors?: string[];
    subscriptionPrompted?: boolean;
    currentPage?: number;
    budget?: string;
    resultImage?: string;
  }>(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionId: integer("session_id").notNull(),
  message: text("message").notNull(),
  messageType: text("message_type").notNull(), // 'user' or 'system'
  mediaUrl: text("media_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  phoneNumber: true,
  skinTone: true,
  preferences: true,
  subscriptionTier: true,
  subscriptionExpiresAt: true,
  colorAnalysisCount: true,
  virtualTryOnCount: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

export const insertUserImageSchema = createInsertSchema(userImages).pick({
  userId: true,
  imageUrl: true,
  cloudinaryPublicId: true,
  imageType: true,
});

export const insertSessionSchema = createInsertSchema(sessions);
export const insertConversationSchema = createInsertSchema(conversations);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserImage = typeof userImages.$inferSelect;
export type InsertUserImage = z.infer<typeof insertUserImageSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;