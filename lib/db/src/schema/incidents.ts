import { pgTable, serial, text, integer, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const incidentsTable = pgTable("incidents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  childId: integer("child_id"),
  description: text("description").notNull(),
  recordedBy: text("recorded_by").notNull(),
  notificationRequired: boolean("notification_required").notNull().default(false),
  notificationReason: text("notification_reason"),
  notificationSuggestedWording: text("notification_suggested_wording"),
  notificationSent: boolean("notification_sent").notNull().default(false),
  riskAssessmentUpdated: boolean("risk_assessment_updated").notNull().default(false),
  status: text("status").notNull().default("open"),
  followUpActions: text("follow_up_actions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({ id: true, createdAt: true, updatedAt: true });

export type Incident = typeof incidentsTable.$inferSelect;
