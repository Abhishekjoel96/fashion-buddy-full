import { User, InsertUser, Session, InsertSession } from "@shared/schema";

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

export class MemStorage implements IStorage {
  #users: Map<number, User>;
  #sessions: Map<number, Session>;
  #currentUserId: number;
  #currentSessionId: number;

  constructor() {
    this.#users = new Map();
    this.#sessions = new Map();
    this.#currentUserId = 1;
    this.#currentSessionId = 1;
  }

  async getUser(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.#users.values()).find(
      (user) => user.phoneNumber === phoneNumber
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.#currentUserId++;
    const user: User = {
      id,
      phoneNumber: insertUser.phoneNumber,
      skinTone: insertUser.skinTone ?? null,
      preferences: insertUser.preferences ?? null
    };
    this.#users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = this.#users.get(id);
    if (!user) throw new Error("User not found");

    const updatedUser: User = {
      ...user,
      ...updates,
      skinTone: updates.skinTone ?? user.skinTone,
      preferences: updates.preferences ?? user.preferences
    };
    this.#users.set(id, updatedUser);
    return updatedUser;
  }

  async getSession(userId: number): Promise<Session | undefined> {
    return Array.from(this.#sessions.values()).find(
      (session) => session.userId === userId
    );
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.#currentSessionId++;
    const session: Session = {
      id,
      userId: insertSession.userId,
      currentState: insertSession.currentState,
      lastInteraction: insertSession.lastInteraction,
      context: insertSession.context ?? null
    };
    this.#sessions.set(id, session);
    return session;
  }

  async updateSession(id: number, updates: Partial<Session>): Promise<Session> {
    const session = this.#sessions.get(id);
    if (!session) throw new Error("Session not found");

    const updatedSession: Session = {
      ...session,
      ...updates,
      currentState: updates.currentState ?? session.currentState,
      lastInteraction: updates.lastInteraction ?? session.lastInteraction,
      context: updates.context ?? session.context
    };
    this.#sessions.set(id, updatedSession);
    return updatedSession;
  }

  async getUserCount(): Promise<number> {
    return this.#users.size;
  }

  async getRecentSessionCount(hours: number): Promise<number> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return Array.from(this.#sessions.values()).filter(
      session => session.lastInteraction > cutoff
    ).length;
  }

  async getProductRecommendationCount(): Promise<number> {
    return Array.from(this.#sessions.values()).filter(
      session => session.currentState === "SHOWING_PRODUCTS"
    ).length;
  }
}

export const storage = new MemStorage();
// Add in-memory fallback storage if DB connection fails
let inMemoryUsers = new Map();
let inMemorySessions = new Map();
let inMemoryConversations = new Map();
let inMemoryProducts = new Map();

// Add a fallback method to the storage class
export function createFallbackStorage() {
  console.log("Using in-memory fallback storage as database connection failed");
  
  return {
    async createUser(user) {
      const id = Date.now().toString();
      inMemoryUsers.set(id, { id, ...user });
      return { id, ...user };
    },
    
    async getUser(phoneNumber) {
      for (const [id, user] of inMemoryUsers.entries()) {
        if (user.phoneNumber === phoneNumber) {
          return user;
        }
      }
      return null;
    },
    
    async updateUser(id, data) {
      const user = inMemoryUsers.get(id);
      if (!user) return null;
      const updatedUser = { ...user, ...data };
      inMemoryUsers.set(id, updatedUser);
      return updatedUser;
    },
    
    async getUserCount() {
      return inMemoryUsers.size;
    },
    
    async createSession(session) {
      const id = Date.now().toString();
      inMemorySessions.set(id, { id, ...session });
      return { id, ...session };
    },
    
    async getSession(userId) {
      for (const [id, session] of inMemorySessions.entries()) {
        if (session.userId === userId) {
          return session;
        }
      }
      return null;
    },
    
    async updateSession(id, data) {
      const session = inMemorySessions.get(id);
      if (!session) return null;
      const updatedSession = { ...session, ...data };
      inMemorySessions.set(id, updatedSession);
      return updatedSession;
    },
    
    async getRecentSessionCount(hours) {
      const now = new Date();
      const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
      let count = 0;
      
      for (const session of inMemorySessions.values()) {
        if (new Date(session.lastInteraction) >= cutoff) {
          count++;
        }
      }
      
      return count;
    },
    
    async addConversationEntry(phoneNumber, entry) {
      if (!inMemoryConversations.has(phoneNumber)) {
        inMemoryConversations.set(phoneNumber, []);
      }
      inMemoryConversations.get(phoneNumber).push(entry);
      return entry;
    },
    
    async getConversationHistory(phoneNumber) {
      return inMemoryConversations.get(phoneNumber) || [];
    },
    
    async addProductRecommendation(recommendation) {
      const id = Date.now().toString();
      inMemoryProducts.set(id, { id, ...recommendation });
      return { id, ...recommendation };
    },
    
    async getProductRecommendationCount() {
      return inMemoryProducts.size;
    }
  };
}

// Modify the main storage object to use fallback if DB connection fails
try {
  // Attempt to connect to the database
  // ... existing database connection code
  
  // If connection fails, use the fallback
} catch (error) {
  console.error("Database connection failed, using in-memory storage:", error);
  storage = createFallbackStorage();
}
