import { Router } from "express";
import { db } from "@workspace/db";
import {
  childrenTable, staffTable, alertsTable, activityTable,
  safeguardingEventsTable, incidentsTable, regulation44Table,
  regulationActionsTable, trainingTable, supervisionsTable,
  complaintsTable, policiesTable
} from "@workspace/db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  try {
    const [children, staff, alerts, actions] = await Promise.all([
      db.select().from(childrenTable).where(eq(childrenTable.status, "current")),
      db.select().from(staffTable).where(eq(staffTable.status, "active")),
      db.select().from(alertsTable).where(eq(alertsTable.status, "active")),
      db.select().from(regulationActionsTable).where(eq(regulationActionsTable.status, "outstanding")),
    ]);

    const criticalAlerts = alerts.filter(a => a.severity === "critical").length;
    const today = new Date().toISOString().split("T")[0];

    // Calculate domain scores
    const dbsExpired = staff.filter(s => s.dbsStatus === "expired").length;
    const dbsExpiringSoon = staff.filter(s => s.dbsStatus === "expiring_soon").length;
    const workforceScore = staff.length > 0
      ? Math.round(((staff.length - dbsExpired - dbsExpiringSoon * 0.5) / staff.length) * 100)
      : 85;

    const openSafeguarding = await db.select().from(safeguardingEventsTable).where(eq(safeguardingEventsTable.status, "open"));
    const safeguardingScore = Math.max(60, 95 - openSafeguarding.length * 5);

    const openComplaints = await db.select().from(complaintsTable).where(eq(complaintsTable.status, "open"));
    const overduePolices = await db.select().from(policiesTable).where(eq(policiesTable.status, "overdue"));
    const governanceScore = Math.max(60, 95 - openComplaints.length * 3 - overduePolices.length * 5);

    const domains = [
      { domain: "children_outcomes", label: "Children & Outcomes", score: 82, trend: "up", alertCount: alerts.filter(a => a.domain === "children_outcomes").length, riskLevel: "low" },
      { domain: "safeguarding", label: "Safeguarding", score: safeguardingScore, trend: openSafeguarding.length > 3 ? "down" : "stable", alertCount: alerts.filter(a => a.domain === "safeguarding").length, riskLevel: openSafeguarding.length > 3 ? "high" : "medium" },
      { domain: "workforce", label: "Workforce Compliance", score: Math.max(60, workforceScore), trend: dbsExpired > 0 ? "down" : "stable", alertCount: alerts.filter(a => a.domain === "workforce").length, riskLevel: dbsExpired > 0 ? "high" : "medium" },
      { domain: "leadership", label: "Leadership & Management", score: 79, trend: "stable", alertCount: alerts.filter(a => a.domain === "leadership").length, riskLevel: "medium" },
      { domain: "documentation", label: "Documentation Quality", score: 88, trend: "up", alertCount: alerts.filter(a => a.domain === "documentation").length, riskLevel: "low" },
      { domain: "governance", label: "Governance", score: governanceScore, trend: "stable", alertCount: alerts.filter(a => a.domain === "governance").length, riskLevel: governanceScore < 70 ? "high" : "low" },
      { domain: "environment", label: "Environment", score: 95, trend: "up", alertCount: alerts.filter(a => a.domain === "environment").length, riskLevel: "low" },
    ];

    const overallScore = Math.round(domains.reduce((sum, d) => sum + d.score, 0) / domains.length);

    res.json({
      overallScore,
      domains,
      criticalAlerts,
      overdueActions: actions.length,
      totalChildren: children.length,
      totalStaff: staff.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
});

router.get("/activity", async (req, res) => {
  try {
    const activity = await db
      .select()
      .from(activityTable)
      .orderBy(desc(activityTable.createdAt))
      .limit(20);

    res.json(activity.map(a => ({
      id: a.id,
      type: a.type,
      description: a.description,
      timestamp: a.createdAt.toISOString(),
      domain: a.domain,
      severity: a.severity,
      relatedEntityType: a.relatedEntityType,
      relatedEntityId: a.relatedEntityId,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

export default router;
