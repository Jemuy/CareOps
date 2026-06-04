import { pgTable, serial, text, integer, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const staffTable = pgTable("staff", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull(),
  startDate: date("start_date").notNull(),
  dbsStatus: text("dbs_status").notNull().default("pending"),
  dbsExpiryDate: date("dbs_expiry_date").notNull(),
  rightToWork: boolean("right_to_work").notNull().default(false),
  qualifications: text("qualifications"),
  mandatoryTrainingComplete: boolean("mandatory_training_complete").notNull().default(false),
  lastSupervisionDate: date("last_supervision_date"),
  lastAppraisalDate: date("last_appraisal_date"),
  complianceScore: integer("compliance_score").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trainingTable = pgTable("training", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull().references(() => staffTable.id),
  trainingType: text("training_type").notNull(),
  category: text("category").notNull(),
  completedDate: date("completed_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  status: text("status").notNull().default("current"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const supervisionsTable = pgTable("supervisions", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull().references(() => staffTable.id),
  supervisorName: text("supervisor_name").notNull(),
  date: date("date").notNull(),
  type: text("type").notNull(),
  notes: text("notes"),
  actionPoints: text("action_points"),
  nextDueDate: date("next_due_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStaffSchema = createInsertSchema(staffTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrainingSchema = createInsertSchema(trainingTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSupervisionSchema = createInsertSchema(supervisionsTable).omit({ id: true, createdAt: true });

export type StaffMember = typeof staffTable.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Training = typeof trainingTable.$inferSelect;
export type Supervision = typeof supervisionsTable.$inferSelect;
