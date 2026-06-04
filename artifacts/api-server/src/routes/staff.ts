import { Router } from "express";
import { db } from "@workspace/db";
import { staffTable, trainingTable, supervisionsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

function computeDbsStatus(expiryDate: string): string {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry < 30) return "expiring_soon";
  return "valid";
}

router.get("/", async (req, res) => {
  try {
    const staff = await db.select().from(staffTable).orderBy(staffTable.firstName);
    const result = staff.map(s => ({
      ...s,
      dbsStatus: computeDbsStatus(s.dbsExpiryDate),
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, role, startDate, dbsExpiryDate, rightToWork, qualifications, status } = req.body;
    if (!firstName || !lastName || !role || !startDate || !dbsExpiryDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const dbsStatus = computeDbsStatus(dbsExpiryDate);
    const [member] = await db.insert(staffTable).values({
      firstName, lastName, role, startDate, dbsExpiryDate,
      dbsStatus,
      rightToWork: rightToWork ?? false,
      qualifications: qualifications ?? null,
      status: status ?? "active",
      complianceScore: dbsStatus === "valid" && rightToWork ? 80 : 50,
    }).returning();
    res.status(201).json(member);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create staff member" });
  }
});

router.get("/compliance/summary", async (req, res) => {
  try {
    const staff = await db.select().from(staffTable).where(eq(staffTable.status, "active"));
    const training = await db.select().from(trainingTable);
    const supervisions = await db.select().from(supervisionsTable);

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const dbsCompliant = staff.filter(s => computeDbsStatus(s.dbsExpiryDate) === "valid").length;
    const dbsExpiringSoon = staff.filter(s => computeDbsStatus(s.dbsExpiryDate) === "expiring_soon").length;
    const dbsExpired = staff.filter(s => computeDbsStatus(s.dbsExpiryDate) === "expired").length;
    const trainingCompliant = staff.filter(s => s.mandatoryTrainingComplete).length;

    const supervisionOverdue = staff.filter(s => {
      if (!s.lastSupervisionDate) return true;
      const lastSupervision = new Date(s.lastSupervisionDate);
      const daysSince = Math.floor((today.getTime() - lastSupervision.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 84;
    }).length;

    const appraisalOverdue = staff.filter(s => {
      if (!s.lastAppraisalDate) return true;
      const lastAppraisal = new Date(s.lastAppraisalDate);
      const daysSince = Math.floor((today.getTime() - lastAppraisal.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > 365;
    }).length;

    const overallScore = staff.length > 0
      ? Math.round(((dbsCompliant + trainingCompliant) / (staff.length * 2)) * 100)
      : 0;

    res.json({
      overallScore,
      dbsCompliant,
      dbsExpiringSoon,
      dbsExpired,
      trainingCompliant,
      supervisionOverdue,
      appraisalOverdue,
      totalStaff: staff.length,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch compliance summary" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [member] = await db.select().from(staffTable).where(eq(staffTable.id, id));
    if (!member) return res.status(404).json({ error: "Staff member not found" });
    res.json({ ...member, dbsStatus: computeDbsStatus(member.dbsExpiryDate) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch staff member" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { role, dbsExpiryDate, rightToWork, qualifications, status, mandatoryTrainingComplete } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (role !== undefined) updates.role = role;
    if (dbsExpiryDate !== undefined) { updates.dbsExpiryDate = dbsExpiryDate; updates.dbsStatus = computeDbsStatus(dbsExpiryDate); }
    if (rightToWork !== undefined) updates.rightToWork = rightToWork;
    if (qualifications !== undefined) updates.qualifications = qualifications;
    if (status !== undefined) updates.status = status;
    if (mandatoryTrainingComplete !== undefined) updates.mandatoryTrainingComplete = mandatoryTrainingComplete;

    const [updated] = await db.update(staffTable).set(updates).where(eq(staffTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Staff member not found" });
    res.json({ ...updated, dbsStatus: computeDbsStatus(updated.dbsExpiryDate) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update staff member" });
  }
});

export default router;
