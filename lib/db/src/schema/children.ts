import { pgTable, serial, text, integer, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const childrenTable = pgTable("children", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  admissionDate: date("admission_date").notNull(),
  status: text("status").notNull().default("current"),
  keyWorker: text("key_worker").notNull(),
  placingAuthority: text("placing_authority"),
  localAuthority: text("local_authority"),
  riskLevel: text("risk_level"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const outcomesTable = pgTable("outcomes", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => childrenTable.id),
  area: text("area").notNull(),
  currentStatus: text("current_status").notNull(),
  baseline: text("baseline").notNull(),
  progress: text("progress").notNull().default("not_assessed"),
  evidence: text("evidence"),
  nextActions: text("next_actions"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const childVoiceTable = pgTable("child_voice", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => childrenTable.id),
  type: text("type").notNull(),
  date: date("date").notNull(),
  summary: text("summary").notNull(),
  quality: text("quality").notNull(),
  recordedBy: text("recorded_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChildSchema = createInsertSchema(childrenTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOutcomeSchema = createInsertSchema(outcomesTable).omit({ id: true, createdAt: true, lastUpdated: true });
export const insertChildVoiceSchema = createInsertSchema(childVoiceTable).omit({ id: true, createdAt: true });

export type Child = typeof childrenTable.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Outcome = typeof outcomesTable.$inferSelect;
export type ChildVoice = typeof childVoiceTable.$inferSelect;
