import { Router } from "express";
import { db } from "@workspace/db";
import { trainingTable, staffTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

function computeTrainingStatus(expiryDate: string): string {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysUntil = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return "expired";
  if (daysUntil < 30) return "expiring_soon";
  return "current";
}

router.get("/compliance/summary", async (req, res) => {
  try {
    const allTraining = await db.select().from(trainingTable);
    const mandatory = allTraining.filter(t => t.category === "mandatory");

    const mandatoryCompliant = mandatory.filter(t => computeTrainingStatus(t.expiryDate) === "current").length;
    const mandatoryExpiringSoon = mandatory.filter(t => computeTrainingStatus(t.expiryDate) === "expiring_soon").length;
    const mandatoryExpired = mandatory.filter(t => computeTrainingStatus(t.expiryDate) === "expired").length;

    const allStaff = await db.select().from(staffTable).where(eq(staffTable.status, "active"));
    const today = new Date();

    const supervisionsDue = allStaff.filter(s => {
      if (!s.lastSupervisionDate) return true;
      const days = Math.floor((today.getTime() - new Date(s.lastSupervisionDate).getTime()) / (1000 * 60 * 60 * 24));
      return days > 84;
    }).length;

    const appraisalsDue = allStaff.filter(s => {
      if (!s.lastAppraisalDate) return true;
      const days = Math.floor((today.getTime() - new Date(s.lastAppraisalDate).getTime()) / (1000 * 60 * 60 * 24));
      return days > 365;
    }).length;

    res.json({ mandatoryCompliant, mandatoryExpiringSoon, mandatoryExpired, supervisionsDue, appraisalsDue });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch training compliance summary" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { staffId, status } = req.query;
    const allTraining = await db.select().from(trainingTable).orderBy(desc(trainingTable.completedDate));
    const allStaff = await db.select().from(staffTable);

    let records = allTraining.map(t => {
      const staff = allStaff.find(s => s.id === t.staffId);
      return {
        ...t,
        staffName: staff ? `${staff.firstName} ${staff.lastName}` : "Unknown",
        status: computeTrainingStatus(t.expiryDate),
      };
    });

    if (staffId) records = records.filter(r => r.staffId === parseInt(staffId as string));
    if (status) records = records.filter(r => r.status === status);

    res.json(records);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch training records" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { staffId, trainingType, category, completedDate, expiryDate, notes } = req.body;
    if (!staffId || !trainingType || !category || !completedDate || !expiryDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const status = computeTrainingStatus(expiryDate);
    const [record] = await db.insert(trainingTable).values({
      staffId, trainingType, category, completedDate, expiryDate, status, notes: notes ?? null,
    }).returning();

    const staff = await db.select().from(staffTable).where(eq(staffTable.id, staffId));
    const staffMember = staff[0];
    res.status(201).json({
      ...record,
      staffName: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : "Unknown",
      status,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create training record" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { completedDate, expiryDate, notes } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (completedDate) updates.completedDate = completedDate;
    if (expiryDate) { updates.expiryDate = expiryDate; updates.status = computeTrainingStatus(expiryDate); }
    if (notes !== undefined) updates.notes = notes;

    const [updated] = await db.update(trainingTable).set(updates).where(eq(trainingTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Training record not found" });

    const staff = await db.select().from(staffTable).where(eq(staffTable.id, updated.staffId));
    const staffMember = staff[0];
    res.json({
      ...updated,
      staffName: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : "Unknown",
      status: computeTrainingStatus(updated.expiryDate),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update training record" });
  }
});

export default router;
