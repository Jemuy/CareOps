import { Router } from "express";
import { db } from "@workspace/db";
import { supervisionsTable, staffTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { staffId } = req.query;
    const allSupervisions = await db.select().from(supervisionsTable).orderBy(desc(supervisionsTable.date));
    const allStaff = await db.select().from(staffTable);

    let records = allSupervisions.map(s => {
      const staff = allStaff.find(m => m.id === s.staffId);
      return {
        ...s,
        staffName: staff ? `${staff.firstName} ${staff.lastName}` : "Unknown",
      };
    });

    if (staffId) records = records.filter(r => r.staffId === parseInt(staffId as string));
    res.json(records);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch supervisions" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { staffId, supervisorName, date, type, notes, actionPoints, nextDueDate } = req.body;
    if (!staffId || !supervisorName || !date || !type || !nextDueDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [record] = await db.insert(supervisionsTable).values({
      staffId, supervisorName, date, type,
      notes: notes ?? null,
      actionPoints: actionPoints ?? null,
      nextDueDate,
    }).returning();

    await db.update(staffTable).set({ lastSupervisionDate: date, updatedAt: new Date() }).where(eq(staffTable.id, staffId));

    const staff = await db.select().from(staffTable).where(eq(staffTable.id, staffId));
    const staffMember = staff[0];
    res.status(201).json({
      ...record,
      staffName: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : "Unknown",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create supervision" });
  }
});

export default router;
