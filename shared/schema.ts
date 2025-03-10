import { pgTable, text, serial, integer, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  skinTone: text("skin_tone"),
  preferences: json("preferences").$type<{
    budget?: string;
    style?: string[];
    sizes?: string[];
  }>(),
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
  }>(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  phoneNumber: true,
  skinTone: true,
  preferences: true,
});

export const insertSessionSchema = createInsertSchema(sessions);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
