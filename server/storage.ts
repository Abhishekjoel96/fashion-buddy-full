import { users, sessions, type User, type InsertUser, type Session, type InsertSession } from "@shared/schema";
import { db } from "./db";
import { eq, gt } from "drizzle-orm";

export interface IStorage {
  getUser(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getSession(userId: number): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, updates: Partial<Session>): Promise<Session>;
  getUserCount(): Promise<number>;
  getRecentSessionCount(hours: number): Promise<number>;
  getProductRecommendationCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(phoneNumber: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
      return user;
    } catch (error) {
      console.error("Database error in getUser:", error);
      throw new Error("Failed to get user");
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values({
        phoneNumber: insertUser.phoneNumber,
        skinTone: insertUser.skinTone ?? null,
        preferences: insertUser.preferences ?? null
      }).returning();
      return user;
    } catch (error) {
      console.error("Database error in createUser:", error);
      throw new Error("Failed to create user");
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return user;
    } catch (error) {
      console.error("Database error in updateUser:", error);
      throw new Error("Failed to update user");
    }
  }

  async getSession(userId: number): Promise<Session | undefined> {
    try {
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId));
      return session;
    } catch (error) {
      console.error("Database error in getSession:", error);
      throw new Error("Failed to get session");
    }
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    try {
      const [session] = await db.insert(sessions).values({
        userId: insertSession.userId,
        currentState: insertSession.currentState,
        lastInteraction: insertSession.lastInteraction,
        context: insertSession.context ?? null
      }).returning();
      return session;
    } catch (error) {
      console.error("Database error in createSession:", error);
      throw new Error("Failed to create session");
    }
  }

  async updateSession(id: number, updates: Partial<Session>): Promise<Session> {
    try {
      const [session] = await db
        .update(sessions)
        .set(updates)
        .where(eq(sessions.id, id))
        .returning();
      return session;
    } catch (error) {
      console.error("Database error in updateSession:", error);
      throw new Error("Failed to update session");
    }
  }

  async getUserCount(): Promise<number> {
    try {
      const result = await db.select().from(users);
      return result.length;
    } catch (error) {
      console.error("Database error in getUserCount:", error);
      throw new Error("Failed to get user count");
    }
  }

  async getRecentSessionCount(hours: number): Promise<number> {
    try {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      const result = await db
        .select()
        .from(sessions)
        .where(gt(sessions.lastInteraction, cutoff));
      return result.length;
    } catch (error) {
      console.error("Database error in getRecentSessionCount:", error);
      throw new Error("Failed to get recent session count");
    }
  }

  async getProductRecommendationCount(): Promise<number> {
    try {
      const result = await db
        .select()
        .from(sessions)
        .where(eq(sessions.currentState, "SHOWING_PRODUCTS"));
      return result.length;
    } catch (error) {
      console.error("Database error in getProductRecommendationCount:", error);
      throw new Error("Failed to get product recommendation count");
    }
  }
}

export const storage = new DatabaseStorage();