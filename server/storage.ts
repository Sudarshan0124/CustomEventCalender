import { users, events, type User, type InsertUser, type Event, type InsertEvent, type UpdateEvent } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Event methods
  getAllEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventsByDateRange(startDate: string, endDate: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: UpdateEvent): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getRecurringEvents(): Promise<Event[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private currentUserId: number;
  private currentEventId: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.currentUserId = 1;
    this.currentEventId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Event methods
  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventsByDateRange(startDate: string, endDate: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => {
      return event.date >= startDate && event.date <= endDate;
    });
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.currentEventId++;
    const event: Event = { ...insertEvent, id };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, updateEvent: UpdateEvent): Promise<Event | undefined> {
    const existingEvent = this.events.get(id);
    if (!existingEvent) return undefined;
    
    const updatedEvent = { ...existingEvent, ...updateEvent };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  async getRecurringEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => 
      event.recurrence !== "none" && !event.originalEventId
    );
  }
}

export const storage = new MemStorage();
