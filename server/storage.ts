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
  // New methods for conversations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationHistory(userId: number, limit?: number): Promise<Conversation[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getSession(userId: number): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.lastInteraction))
      .limit(1);
    return session;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateSession(id: number, updates: Partial<Session>): Promise<Session> {
    const [session] = await db
      .update(sessions)
      .set(updates)
      .where(eq(sessions.id, id))
      .returning();
    return session;
  }

  async getUserCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql`count(*)::int` })
      .from(users);
    return result?.count ?? 0;
  }

  async getRecentSessionCount(hours: number): Promise<number> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const [result] = await db
      .select({ count: sql`count(*)::int` })
      .from(sessions)
      .where(sql`last_interaction > ${cutoff}`);
    return result?.count ?? 0;
  }

  async getProductRecommendationCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql`count(*)::int` })
      .from(sessions)
      .where(eq(sessions.currentState, 'SHOWING_PRODUCTS'));
    return result?.count ?? 0;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [result] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return result;
  }

  async getConversationHistory(userId: number, limit: number = 50): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();