import { Router } from "express";
import { db } from "@workspace/db";
import { childrenTable, outcomesTable, childVoiceTable, safeguardingEventsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

function childScore(child: typeof childrenTable.$inferSelect, voices: typeof childVoiceTable.$inferSelect[]): number {
  if (voices.length === 0) return 0;
  const strong = voices.filter(v => v.quality === "strong").length;
  return Math.round((strong / voices.length) * 100);
}

router.get("/", async (req, res) => {
  try {
    const children = await db.select().from(childrenTable).orderBy(desc(childrenTable.admissionDate));
    const allVoice = await db.select().from(childVoiceTable);

    const result = children.map(c => {
      const voices = allVoice.filter(v => v.childId === c.id);
      const lastVoice = voices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      return {
        ...c,
        childVoiceScore: childScore(c, voices),
        lastChildVoiceDate: lastVoice?.date ?? null,
      };
    });

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch children" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, admissionDate, keyWorker, placingAuthority, localAuthority, status, notes } = req.body;
    if (!firstName || !lastName || !dateOfBirth || !admissionDate || !keyWorker) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [child] = await db.insert(childrenTable).values({
      firstName, lastName, dateOfBirth, admissionDate, keyWorker,
      placingAuthority: placingAuthority ?? null,
      localAuthority: localAuthority ?? null,
      status: status ?? "current",
      notes: notes ?? null,
    }).returning();
    res.status(201).json(child);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create child" });
  }
});

router.get("/outcomes/summary", async (req, res) => {
  try {
    const outcomes = await db.select().from(outcomesTable);
    const areas = ["education", "health", "relationships", "independence", "employment", "community"];
    const byArea = areas.map(area => {
      const areaOutcomes = outcomes.filter(o => o.area === area);
      return {
        area,
        improving: areaOutcomes.filter(o => o.progress === "improving").length,
        stable: areaOutcomes.filter(o => o.progress === "stable").length,
        declining: areaOutcomes.filter(o => o.progress === "declining").length,
        notAssessed: areaOutcomes.filter(o => o.progress === "not_assessed").length,
      };
    });
    const improving = outcomes.filter(o => o.progress === "improving").length;
    const total = outcomes.length;
    const overallProgress = total === 0 ? "No data" : improving > total * 0.6 ? "Generally improving" : "Mixed progress";
    res.json({ byArea, overallProgress });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch outcomes summary" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, id));
    if (!child) return res.status(404).json({ error: "Child not found" });

    const voices = await db.select().from(childVoiceTable).where(eq(childVoiceTable.childId, id)).orderBy(desc(childVoiceTable.date));
    const lastVoice = voices[0];

    res.json({
      ...child,
      childVoiceScore: childScore(child, voices),
      lastChildVoiceDate: lastVoice?.date ?? null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch child" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { keyWorker, status, placingAuthority, localAuthority, notes } = req.body;
    const [updated] = await db
      .update(childrenTable)
      .set({ keyWorker, status, placingAuthority, localAuthority, notes, updatedAt: new Date() })
      .where(eq(childrenTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Child not found" });
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update child" });
  }
});

router.get("/:id/outcomes", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const outcomes = await db.select().from(outcomesTable).where(eq(outcomesTable.childId, id)).orderBy(desc(outcomesTable.lastUpdated));
    res.json(outcomes.map(o => ({ ...o, lastUpdated: o.lastUpdated.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch outcomes" });
  }
});

router.post("/:id/outcomes", async (req, res) => {
  try {
    const childId = parseInt(req.params.id);
    const { area, currentStatus, baseline, progress, evidence, nextActions } = req.body;
    if (!area || !currentStatus || !baseline) return res.status(400).json({ error: "Missing required fields" });
    const [outcome] = await db.insert(outcomesTable).values({
      childId, area, currentStatus, baseline,
      progress: progress ?? "not_assessed",
      evidence: evidence ?? null,
      nextActions: nextActions ?? null,
    }).returning();
    res.status(201).json({ ...outcome, lastUpdated: outcome.lastUpdated.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create outcome" });
  }
});

router.get("/:id/voice", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const voices = await db.select().from(childVoiceTable).where(eq(childVoiceTable.childId, id)).orderBy(desc(childVoiceTable.date));
    res.json(voices);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch child voice records" });
  }
});

router.post("/:id/voice", async (req, res) => {
  try {
    const childId = parseInt(req.params.id);
    const { type, date, summary, quality, recordedBy } = req.body;
    if (!type || !date || !summary || !quality) return res.status(400).json({ error: "Missing required fields" });
    const [voice] = await db.insert(childVoiceTable).values({
      childId, type, date, summary, quality, recordedBy: recordedBy ?? null,
    }).returning();
    res.status(201).json(voice);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create child voice record" });
  }
});

export default router;
