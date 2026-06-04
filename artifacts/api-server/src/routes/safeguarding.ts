import { Router } from "express";
import { db } from "@workspace/db";
import { safeguardingEventsTable, missingEpisodesTable, childrenTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

async function enrichWithChildName<T extends { childId: number }>(items: T[]) {
  const children = await db.select().from(childrenTable);
  return items.map(item => ({
    ...item,
    childName: (() => {
      const child = children.find(c => c.id === item.childId);
      return child ? `${child.firstName} ${child.lastName}` : null;
    })(),
  }));
}

router.get("/", async (req, res) => {
  try {
    const { childId, type } = req.query;
    const events = await db.select().from(safeguardingEventsTable).orderBy(desc(safeguardingEventsTable.date));

    let filtered = events;
    if (childId) filtered = filtered.filter(e => e.childId === parseInt(childId as string));
    if (type) filtered = filtered.filter(e => e.type === type);

    const enriched = await enrichWithChildName(filtered);
    res.json(enriched.map(e => ({
      ...e,
      closedAt: (e as any).closedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch safeguarding events" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { childId, type, date, description, riskLevel, reportedBy, actionTaken } = req.body;
    if (!childId || !type || !date || !description || !riskLevel || !reportedBy) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const notificationRequired = riskLevel === "critical" || riskLevel === "high" || type === "child_protection";
    const [event] = await db.insert(safeguardingEventsTable).values({
      childId, type, date, description, riskLevel,
      status: "open",
      reportedBy,
      actionTaken: actionTaken ?? null,
      notificationRequired,
      notificationSent: false,
    }).returning();
    const [enriched] = await enrichWithChildName([event]);
    res.status(201).json({ ...enriched, closedAt: null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create safeguarding event" });
  }
});

router.get("/missing-episodes", async (req, res) => {
  try {
    const { childId } = req.query;
    const episodes = await db.select().from(missingEpisodesTable).orderBy(desc(missingEpisodesTable.missingFrom));

    let filtered = episodes;
    if (childId) filtered = filtered.filter(e => e.childId === parseInt(childId as string));

    const enriched = await enrichWithChildName(filtered);
    res.json(enriched.map(e => ({
      ...e,
      missingFrom: (e as any).missingFrom.toISOString(),
      returnedAt: (e as any).returnedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch missing episodes" });
  }
});

router.post("/missing-episodes", async (req, res) => {
  try {
    const { childId, missingFrom, reportedToPolice, policeRef, circumstances, riskLevel } = req.body;
    if (!childId || !missingFrom || !riskLevel) return res.status(400).json({ error: "Missing required fields" });
    const [episode] = await db.insert(missingEpisodesTable).values({
      childId,
      missingFrom: new Date(missingFrom),
      reportedToPolice: reportedToPolice ?? false,
      policeRef: policeRef ?? null,
      circumstances: circumstances ?? null,
      riskLevel,
      returnInterviewCompleted: false,
    }).returning();
    const [enriched] = await enrichWithChildName([episode]);
    res.status(201).json({
      ...enriched,
      missingFrom: episode.missingFrom.toISOString(),
      returnedAt: null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create missing episode" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [event] = await db.select().from(safeguardingEventsTable).where(eq(safeguardingEventsTable.id, id));
    if (!event) return res.status(404).json({ error: "Safeguarding event not found" });
    const [enriched] = await enrichWithChildName([event]);
    res.json({ ...enriched, closedAt: (event as any).closedAt?.toISOString() ?? null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch safeguarding event" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, actionTaken, riskLevel, notificationSent } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (actionTaken) updates.actionTaken = actionTaken;
    if (riskLevel) updates.riskLevel = riskLevel;
    if (notificationSent !== undefined) updates.notificationSent = notificationSent;
    if (status === "closed") updates.closedAt = new Date();

    const [updated] = await db.update(safeguardingEventsTable).set(updates).where(eq(safeguardingEventsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Event not found" });
    const [enriched] = await enrichWithChildName([updated]);
    res.json({ ...enriched, closedAt: (updated as any).closedAt?.toISOString() ?? null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update safeguarding event" });
  }
});

export default router;
