import { User, Session } from '@shared/schema';
import Database from '@replit/database';

// Type for conversation history
export interface ConversationEntry {
  timestamp: Date;
  from: 'user' | 'bot';
  message: string;
  mediaUrl?: string;
}

// Extended user type with name field
export interface ExtendedUser extends User {
  name?: string;
  conversations?: ConversationEntry[];
}

// Use Replit Key-Value Store
const db = new Database();

// Prefix keys for organization
const USERS_PREFIX = 'users:';
const SESSIONS_PREFIX = 'sessions:';
const STATS_PREFIX = 'stats:';

export async function getUser(phoneNumber: string): Promise<ExtendedUser | undefined> {
  try {
    const key = `${USERS_PREFIX}${phoneNumber}`;
    return await db.get(key);
  } catch (error) {
    console.error('Error getting user:', error);
    return undefined;
  }
}

export async function createUser(user: ExtendedUser): Promise<ExtendedUser> {
  try {
    const key = `${USERS_PREFIX}${user.phoneNumber}`;
    await db.set(key, user);
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(phoneNumber: string, updates: Partial<ExtendedUser>): Promise<ExtendedUser> {
  try {
    const key = `${USERS_PREFIX}${phoneNumber}`;
    const user = await db.get(key) as ExtendedUser | undefined;

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = { ...user, ...updates };
    await db.set(key, updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function getSession(userId: number): Promise<Session | undefined> {
  try {
    const key = `${SESSIONS_PREFIX}${userId}`;
    return await db.get(key);
  } catch (error) {
    console.error('Error getting session:', error);
    return undefined;
  }
}

export async function createSession(session: Session): Promise<Session> {
  try {
    const key = `${SESSIONS_PREFIX}${session.userId}`;
    await db.set(key, session);
    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

export async function updateSession(userId: number, updates: Partial<Session>): Promise<Session> {
  try {
    const key = `${SESSIONS_PREFIX}${userId}`;
    const session = await db.get(key) as Session | undefined;

    if (!session) {
      throw new Error('Session not found');
    }

    const updatedSession = { ...session, ...updates };
    await db.set(key, updatedSession);
    return updatedSession;
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
}

export async function addConversationEntry(
  phoneNumber: string,
  entry: ConversationEntry
): Promise<void> {
  try {
    const user = await getUser(phoneNumber) as ExtendedUser | undefined;

    if (!user) {
      throw new Error('User not found');
    }

    const conversations = user.conversations || [];
    conversations.push(entry);

    await updateUser(phoneNumber, { conversations });
  } catch (error) {
    console.error('Error adding conversation entry:', error);
    throw error;
  }
}

export async function getUserCount(): Promise<number> {
  try {
    const keys = await db.list(USERS_PREFIX);
    return keys.length;
  } catch (error) {
    console.error('Error getting user count:', error);
    return 0;
  }
}

export async function getRecentSessionCount(hours: number): Promise<number> {
  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const keys = await db.list(SESSIONS_PREFIX);
    let count = 0;

    for (const key of keys) {
      const session = await db.get(key) as Session;
      if (session && new Date(session.lastInteraction) > cutoff) {
        count++;
      }
    }

    return count;
  } catch (error) {
    console.error('Error getting recent session count:', error);
    return 0;
  }
}

export async function getProductRecommendationCount(): Promise<number> {
  try {
    const keys = await db.list(SESSIONS_PREFIX);
    let count = 0;

    for (const key of keys) {
      const session = await db.get(key) as Session;
      if (session && session.currentState === 'SHOWING_PRODUCTS') {
        count++;
      }
    }

    return count;
  } catch (error) {
    console.error('Error getting product recommendation count:', error);
    return 0;
  }
}