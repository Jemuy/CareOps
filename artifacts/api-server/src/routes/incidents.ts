import { Router } from "express";
import { db } from "@workspace/db";
import { incidentsTable, childrenTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

function assessNotification(severity: string, type: string): { required: boolean; reason: string | null; wording: string | null } {
  if (severity === "critical" || severity === "serious") {
    return {
      required: true,
      reason: `Incident of ${severity} severity requires Ofsted notification under Regulation 40 of the Children's Home Regulations 2015.`,
      wording: `We are writing to notify Ofsted of a ${severity} incident that occurred at our home. The incident involved [describe briefly]. We have taken immediate action including [actions taken]. A full review will be completed within [timeframe] and we will provide a follow-up report.`,
    };
  }
  if (type === "self_harm" || type === "absconding") {
    return {
      required: true,
      reason: `Incidents involving ${type.replace("_", " ")} require notification as they relate to the welfare and safety of a looked-after child.`,
      wording: `We are notifying Ofsted regarding an incident of ${type.replace("_", " ")}. The young person has been supported and is currently safe. Steps taken include [actions taken].`,
    };
  }
  return { required: false, reason: null, wording: null };
}

router.get("/", async (req, res) => {
  try {
    const { childId, requiresNotification } = req.query;
    const incidents = await db.select().from(incidentsTable).orderBy(desc(incidentsTable.date));
    const children = await db.select().from(childrenTable);

    let filtered = incidents;
    if (childId) filtered = filtered.filter(i => i.childId === parseInt(childId as string));
    if (requiresNotification === "true") filtered = filtered.filter(i => i.notificationRequired);

    const enriched = filtered.map(i => {
      const child = i.childId ? children.find(c => c.id === i.childId) : null;
      return {
        ...i,
        childName: child ? `${child.firstName} ${child.lastName}` : null,
        date: (i.date as any).toISOString(),
      };
    });

    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, date, type, severity, childId, description, recordedBy, followUpActions } = req.body;
    if (!title || !date || !type || !severity || !recordedBy || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const assessment = assessNotification(severity, type);
    const [incident] = await db.insert(incidentsTable).values({
      title, date: new Date(date), type, severity,
      childId: childId ?? null,
      description, recordedBy,
      notificationRequired: assessment.required,
      notificationReason: assessment.reason,
      notificationSuggestedWording: assessment.wording,
      notificationSent: false,
      riskAssessmentUpdated: false,
      status: "open",
      followUpActions: followUpActions ?? null,
    }).returning();

    const children = await db.select().from(childrenTable);
    const child = incident.childId ? children.find(c => c.id === incident.childId) : null;

    res.status(201).json({
      ...incident,
      childName: child ? `${child.firstName} ${child.lastName}` : null,
      date: incident.date.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create incident" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [incident] = await db.select().from(incidentsTable).where(eq(incidentsTable.id, id));
    if (!incident) return res.status(404).json({ error: "Incident not found" });
    const children = await db.select().from(childrenTable);
    const child = incident.childId ? children.find(c => c.id === incident.childId) : null;
    res.json({ ...incident, childName: child ? `${child.firstName} ${child.lastName}` : null, date: incident.date.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch incident" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, notificationSent, riskAssessmentUpdated, followUpActions } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (notificationSent !== undefined) updates.notificationSent = notificationSent;
    if (riskAssessmentUpdated !== undefined) updates.riskAssessmentUpdated = riskAssessmentUpdated;
    if (followUpActions) updates.followUpActions = followUpActions;

    const [updated] = await db.update(incidentsTable).set(updates).where(eq(incidentsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Incident not found" });
    const children = await db.select().from(childrenTable);
    const child = updated.childId ? children.find(c => c.id === updated.childId) : null;
    res.json({ ...updated, childName: child ? `${child.firstName} ${child.lastName}` : null, date: updated.date.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update incident" });
  }
});

export default router;
