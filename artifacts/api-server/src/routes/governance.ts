import { Router } from "express";
import { db } from "@workspace/db";
import { complaintsTable, notificationsTable, policiesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/complaints", async (req, res) => {
  try {
    const complaints = await db.select().from(complaintsTable).orderBy(desc(complaintsTable.date));
    res.json(complaints.map(c => ({
      ...c,
      resolvedAt: c.resolvedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

router.post("/complaints", async (req, res) => {
  try {
    const { type, date, description, raisedBy, linkedChildId } = req.body;
    if (!type || !date || !description || !raisedBy) return res.status(400).json({ error: "Missing required fields" });
    const [complaint] = await db.insert(complaintsTable).values({
      type, date, description, raisedBy,
      linkedChildId: linkedChildId ?? null,
      status: "open",
    }).returning();
    res.status(201).json({ ...complaint, resolvedAt: null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create complaint" });
  }
});

router.patch("/complaints/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, assignedTo, resolution } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (assignedTo) updates.assignedTo = assignedTo;
    if (resolution) { updates.resolution = resolution; if (status === "resolved") updates.resolvedAt = new Date(); }

    const [updated] = await db.update(complaintsTable).set(updates).where(eq(complaintsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Complaint not found" });
    res.json({ ...updated, resolvedAt: updated.resolvedAt?.toISOString() ?? null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update complaint" });
  }
});

router.get("/notifications", async (req, res) => {
  try {
    const notifications = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.date));
    res.json(notifications.map(n => ({
      ...n,
      sentAt: n.sentAt?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.post("/notifications", async (req, res) => {
  try {
    const { type, date, description, notificationRequired, notificationReason, suggestedWording } = req.body;
    if (!type || !date || !description) return res.status(400).json({ error: "Missing required fields" });
    const [notification] = await db.insert(notificationsTable).values({
      type, date, description,
      notificationRequired: notificationRequired ?? false,
      notificationReason: notificationReason ?? null,
      suggestedWording: suggestedWording ?? null,
      sent: false,
    }).returning();
    res.status(201).json({ ...notification, sentAt: null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

router.get("/policies", async (req, res) => {
  try {
    const policies = await db.select().from(policiesTable).orderBy(policiesTable.title);

    const today = new Date();
    const enriched = policies.map(p => {
      const nextReview = new Date(p.nextReviewDate);
      const daysUntil = Math.floor((nextReview.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      let status = "current";
      if (daysUntil < 0) status = "overdue";
      else if (daysUntil < 30) status = "due_for_review";
      return { ...p, status };
    });

    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch policies" });
  }
});

router.post("/policies", async (req, res) => {
  try {
    const { title, category, version, lastReviewedDate, nextReviewDate, owner } = req.body;
    if (!title || !category || !version || !lastReviewedDate || !nextReviewDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [policy] = await db.insert(policiesTable).values({
      title, category, version, lastReviewedDate, nextReviewDate,
      owner: owner ?? null,
      status: "current",
    }).returning();
    res.status(201).json(policy);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create policy" });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const [complaints, notifications, policies] = await Promise.all([
      db.select().from(complaintsTable),
      db.select().from(notificationsTable),
      db.select().from(policiesTable),
    ]);

    const today = new Date();
    const openComplaints = complaints.filter(c => c.status === "open" || c.status === "under_investigation").length;
    const pendingNotifications = notifications.filter(n => n.notificationRequired && !n.sent).length;

    const policiesOverdue = policies.filter(p => {
      const nextReview = new Date(p.nextReviewDate);
      return nextReview < today;
    }).length;

    const policiesDueSoon = policies.filter(p => {
      const nextReview = new Date(p.nextReviewDate);
      const daysUntil = Math.floor((nextReview.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil < 30;
    }).length;

    const overallScore = Math.max(50, 100 - openComplaints * 5 - pendingNotifications * 10 - policiesOverdue * 8);

    res.json({ openComplaints, pendingNotifications, policiesOverdue, policiesDueSoon, overallScore });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch governance summary" });
  }
});

export default router;
