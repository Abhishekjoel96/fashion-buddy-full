import { User, InsertUser, Session, InsertSession, Conversation, InsertConversation } from "@shared/schema";
import { users, sessions, conversations } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

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
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationHistory(userId: number, limit?: number): Promise<Conversation[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(phoneNumber: string): Promise<User | undefined> {
    try {
      console.log("Getting user with phone number:", phoneNumber);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.phoneNumber, phoneNumber));
      console.log("Retrieved user:", user);
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      console.log("Creating user:", insertUser);
      const [user] = await db
        .insert(users)
        .values({
          name: insertUser.name,
          phoneNumber: insertUser.phoneNumber,
          skinTone: insertUser.skinTone,
          preferences: insertUser.preferences
        })
        .returning();
      console.log("Created user:", user);
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    try {
      console.log("Updating user:", id, updates);
      const [user] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      console.log("Updated user:", user);
      return user;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async getSession(userId: number): Promise<Session | undefined> {
    try {
      console.log("Getting session for user:", userId);
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .orderBy(desc(sessions.lastInteraction))
        .limit(1);
      console.log("Retrieved session:", session);
      return session;
    } catch (error) {
      console.error("Error getting session:", error);
      throw error;
    }
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    try {
      console.log("Creating session:", insertSession);
      const [session] = await db
        .insert(sessions)
        .values({
          userId: insertSession.userId,
          currentState: insertSession.currentState,
          lastInteraction: insertSession.lastInteraction,
          context: insertSession.context
        })
        .returning();
      console.log("Created session:", session);
      return session;
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  }

  async updateSession(id: number, updates: Partial<Session>): Promise<Session> {
    try {
      console.log("Updating session:", id, updates);
      const [session] = await db
        .update(sessions)
        .set(updates)
        .where(eq(sessions.id, id))
        .returning();
      console.log("Updated session:", session);
      return session;
    } catch (error) {
      console.error("Error updating session:", error);
      throw error;
    }
  }

  async getUserCount(): Promise<number> {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users);
      return result?.count || 0;
    } catch (error) {
      console.error("Error getting user count:", error);
      throw error;
    }
  }

  async getRecentSessionCount(hours: number): Promise<number> {
    try {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(sessions)
        .where(sql`last_interaction > ${cutoff}`);
      return result?.count || 0;
    } catch (error) {
      console.error("Error getting recent session count:", error);
      throw error;
    }
  }

  async getProductRecommendationCount(): Promise<number> {
    try {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(sessions)
        .where(eq(sessions.currentState, 'SHOWING_PRODUCTS'));
      return result?.count || 0;
    } catch (error) {
      console.error("Error getting product recommendation count:", error);
      throw error;
    }
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    try {
      console.log("Creating conversation:", conversation);
      const [result] = await db
        .insert(conversations)
        .values({
          userId: conversation.userId,
          sessionId: conversation.sessionId,
          message: conversation.message,
          messageType: conversation.messageType,
          mediaUrl: conversation.mediaUrl
        })
        .returning();
      console.log("Created conversation:", result);
      return result;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }

  async getConversationHistory(userId: number, limit: number = 50): Promise<Conversation[]> {
    try {
      console.log("Getting conversation history for user:", userId, "limit:", limit);
      const history = await db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.createdAt))
        .limit(limit);
      console.log("Retrieved conversation history count:", history.length);
      return history;
    } catch (error) {
      console.error("Error getting conversation history:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();