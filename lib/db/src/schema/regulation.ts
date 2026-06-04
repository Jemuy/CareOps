import { pgTable, serial, text, integer, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const regulation44Table = pgTable("regulation44_visits", {
  id: serial("id").primaryKey(),
  visitDate: date("visit_date").notNull(),
  conductedBy: text("conducted_by").notNull(),
  summary: text("summary").notNull(),
  overallFinding: text("overall_finding").notNull(),
  nextDueDate: date("next_due_date").notNull(),
  reportUploaded: boolean("report_uploaded").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const regulation45Table = pgTable("regulation45_reviews", {
  id: serial("id").primaryKey(),
  reviewDate: date("review_date").notNull(),
  completedBy: text("completed_by").notNull(),
  period: text("period").notNull(),
  summary: text("summary").notNull(),
  qualityRating: text("quality_rating").notNull(),
  actionsRaised: integer("actions_raised").notNull().default(0),
  reportUploaded: boolean("report_uploaded").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const regulationActionsTable = pgTable("regulation_actions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date").notNull(),
  status: text("status").notNull().default("outstanding"),
  assignedTo: text("assigned_to").notNull(),
  source: text("source").notNull(),
  reg44Id: integer("reg44_id").references(() => regulation44Table.id),
  reg45Id: integer("reg45_id").references(() => regulation45Table.id),
  evidenceUploaded: boolean("evidence_uploaded").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRegulation44Schema = createInsertSchema(regulation44Table).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRegulation45Schema = createInsertSchema(regulation45Table).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRegulationActionSchema = createInsertSchema(regulationActionsTable).omit({ id: true, createdAt: true, updatedAt: true });

export type Regulation44Visit = typeof regulation44Table.$inferSelect;
export type Regulation45Review = typeof regulation45Table.$inferSelect;
export type RegulationAction = typeof regulationActionsTable.$inferSelect;
