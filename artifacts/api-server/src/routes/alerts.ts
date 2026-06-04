import { Router } from "express";
import { db } from "@workspace/db";
import { alertsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { UpdateAlertBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { severity, domain, resolved } = req.query;
    let query = db.select().from(alertsTable);

    const rows = await db.select().from(alertsTable).orderBy(desc(alertsTable.createdAt));
    let filtered = rows;

    if (severity) filtered = filtered.filter(a => a.severity === severity);
    if (domain) filtered = filtered.filter(a => a.domain === domain);
    if (resolved === "true") filtered = filtered.filter(a => a.status === "resolved");
    else if (resolved === "false") filtered = filtered.filter(a => a.status !== "resolved");

    res.json(filtered.map(a => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      resolvedAt: a.resolvedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

router.get("/counts", async (req, res) => {
  try {
    const alerts = await db.select().from(alertsTable).where(eq(alertsTable.status, "active"));
    const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 } as Record<string, number>;
    const byDomainMap: Record<string, number> = {};

    for (const alert of alerts) {
      bySeverity[alert.severity] = (bySeverity[alert.severity] ?? 0) + 1;
      byDomainMap[alert.domain] = (byDomainMap[alert.domain] ?? 0) + 1;
    }

    res.json({
      total: alerts.length,
      bySeverity,
      byDomain: Object.entries(byDomainMap).map(([domain, count]) => ({ domain, count })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch alert counts" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [alert] = await db.select().from(alertsTable).where(eq(alertsTable.id, id));
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json({ ...alert, createdAt: alert.createdAt.toISOString(), resolvedAt: alert.resolvedAt?.toISOString() ?? null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch alert" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = UpdateAlertBody.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });

    const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
    if (parsed.data.status === "resolved") updates.resolvedAt = new Date();

    const [updated] = await db
      .update(alertsTable)
      .set(updates)
      .where(eq(alertsTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Alert not found" });
    res.json({ ...updated, createdAt: updated.createdAt.toISOString(), resolvedAt: updated.resolvedAt?.toISOString() ?? null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update alert" });
  }
});

export default router;
