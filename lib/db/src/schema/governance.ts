import { pgTable, serial, text, integer, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const complaintsTable = pgTable("complaints", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  raisedBy: text("raised_by").notNull(),
  assignedTo: text("assigned_to"),
  status: text("status").notNull().default("open"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  linkedChildId: integer("linked_child_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationsTable = pgTable("ofsted_notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  notificationRequired: boolean("notification_required").notNull().default(false),
  notificationReason: text("notification_reason"),
  suggestedWording: text("suggested_wording"),
  sent: boolean("sent").notNull().default(false),
  sentAt: timestamp("sent_at"),
  reference: text("reference"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const policiesTable = pgTable("policies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  version: text("version").notNull(),
  lastReviewedDate: date("last_reviewed_date").notNull(),
  nextReviewDate: date("next_review_date").notNull(),
  status: text("status").notNull().default("current"),
  owner: text("owner"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(),
  domain: text("domain").notNull(),
  riskExplanation: text("risk_explanation").notNull(),
  regulatoryImpact: text("regulatory_impact").notNull(),
  recommendedAction: text("recommended_action").notNull(),
  assignedTo: text("assigned_to"),
  status: text("status").notNull().default("active"),
  resolvedAt: timestamp("resolved_at"),
  notes: text("notes"),
  dueDate: date("due_date"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: integer("related_entity_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  domain: text("domain").notNull(),
  severity: text("severity"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: integer("related_entity_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertComplaintSchema = createInsertSchema(complaintsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPolicySchema = createInsertSchema(policiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true, updatedAt: true });

export type Complaint = typeof complaintsTable.$inferSelect;
export type OfstedNotification = typeof notificationsTable.$inferSelect;
export type Policy = typeof policiesTable.$inferSelect;
export type Alert = typeof alertsTable.$inferSelect;
export type Activity = typeof activityTable.$inferSelect;
