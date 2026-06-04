import { Router } from "express";
import { db } from "@workspace/db";
import { regulation44Table, regulation45Table, regulationActionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

export const reg44Router = Router();
export const reg45Router = Router();
export const regulationRouter = Router();

// ── REGULATION 44 ─────────────────────────────────────────────────────────

reg44Router.get("/", async (req, res) => {
  try {
    const visits = await db.select().from(regulation44Table).orderBy(desc(regulation44Table.visitDate));
    const actions = await db.select().from(regulationActionsTable).where(eq(regulationActionsTable.source, "reg44"));

    const result = visits.map(v => ({
      ...v,
      actions: actions
        .filter(a => a.reg44Id === v.id)
        .map(a => ({ ...a, completedAt: a.completedAt?.toISOString() ?? null })),
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch Regulation 44 visits" });
  }
});

reg44Router.post("/", async (req, res) => {
  try {
    const { visitDate, conductedBy, summary, overallFinding, nextDueDate, reportUploaded } = req.body;
    if (!visitDate || !conductedBy || !summary || !overallFinding || !nextDueDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [visit] = await db.insert(regulation44Table).values({
      visitDate, conductedBy, summary, overallFinding, nextDueDate,
      reportUploaded: reportUploaded ?? false,
    }).returning();
    res.status(201).json({ ...visit, actions: [] });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create Regulation 44 visit" });
  }
});

reg44Router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { summary, overallFinding, reportUploaded } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (summary) updates.summary = summary;
    if (overallFinding) updates.overallFinding = overallFinding;
    if (reportUploaded !== undefined) updates.reportUploaded = reportUploaded;

    const [updated] = await db.update(regulation44Table).set(updates).where(eq(regulation44Table.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Visit not found" });

    const actions = await db.select().from(regulationActionsTable).where(eq(regulationActionsTable.reg44Id, id));
    res.json({ ...updated, actions: actions.map(a => ({ ...a, completedAt: a.completedAt?.toISOString() ?? null })) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update Regulation 44 visit" });
  }
});

// ── REGULATION 45 ─────────────────────────────────────────────────────────

reg45Router.get("/", async (req, res) => {
  try {
    const reviews = await db.select().from(regulation45Table).orderBy(desc(regulation45Table.reviewDate));
    res.json(reviews);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch Regulation 45 reviews" });
  }
});

reg45Router.post("/", async (req, res) => {
  try {
    const { reviewDate, completedBy, period, summary, qualityRating, actionsRaised, reportUploaded } = req.body;
    if (!reviewDate || !completedBy || !period || !summary || !qualityRating) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [review] = await db.insert(regulation45Table).values({
      reviewDate, completedBy, period, summary, qualityRating,
      actionsRaised: actionsRaised ?? 0,
      reportUploaded: reportUploaded ?? false,
    }).returning();
    res.status(201).json(review);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create Regulation 45 review" });
  }
});

// ── REGULATION ACTIONS ────────────────────────────────────────────────────

regulationRouter.get("/actions", async (req, res) => {
  try {
    const actions = await db.select().from(regulationActionsTable).orderBy(regulationActionsTable.dueDate);
    res.json(actions.map(a => ({
      ...a,
      completedAt: a.completedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch outstanding actions" });
  }
});
