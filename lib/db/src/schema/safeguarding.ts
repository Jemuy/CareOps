import { pgTable, serial, text, integer, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { childrenTable } from "./children";

export const safeguardingEventsTable = pgTable("safeguarding_events", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => childrenTable.id),
  type: text("type").notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  riskLevel: text("risk_level").notNull(),
  status: text("status").notNull().default("open"),
  reportedBy: text("reported_by").notNull(),
  actionTaken: text("action_taken"),
  notificationRequired: boolean("notification_required").notNull().default(false),
  notificationSent: boolean("notification_sent").notNull().default(false),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const missingEpisodesTable = pgTable("missing_episodes", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => childrenTable.id),
  missingFrom: timestamp("missing_from").notNull(),
  returnedAt: timestamp("returned_at"),
  returnInterviewCompleted: boolean("return_interview_completed").notNull().default(false),
  returnInterviewDate: date("return_interview_date"),
  reportedToPolice: boolean("reported_to_police").notNull().default(false),
  policeRef: text("police_ref"),
  circumstances: text("circumstances"),
  riskLevel: text("risk_level").notNull().default("medium"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSafeguardingEventSchema = createInsertSchema(safeguardingEventsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMissingEpisodeSchema = createInsertSchema(missingEpisodesTable).omit({ id: true, createdAt: true, updatedAt: true });

export type SafeguardingEvent = typeof safeguardingEventsTable.$inferSelect;
export type MissingEpisode = typeof missingEpisodesTable.$inferSelect;
