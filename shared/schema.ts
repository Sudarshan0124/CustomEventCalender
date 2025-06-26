import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date").notNull(), // ISO date string
  time: text("time").notNull(), // HH:MM format
  category: text("category").notNull().default("personal"),
  recurrence: text("recurrence").notNull().default("none"),
  recurrenceConfig: text("recurrence_config"), // JSON string for custom recurrence
  originalEventId: integer("original_event_id"), // For recurring event instances
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
});

export const updateEventSchema = insertEventSchema.partial();

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;

// User schema (keeping existing)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
