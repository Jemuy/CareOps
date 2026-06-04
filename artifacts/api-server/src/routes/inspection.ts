import { Router } from "express";
import { db } from "@workspace/db";
import {
  childrenTable, staffTable, safeguardingEventsTable, missingEpisodesTable,
  incidentsTable, complaintsTable, notificationsTable, regulationActionsTable,
  childVoiceTable, outcomesTable, trainingTable, supervisionsTable, policiesTable
} from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function computeDbsStatus(expiryDate: string): string {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysUntil = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return "expired";
  if (daysUntil < 30) return "expiring_soon";
  return "valid";
}

async function buildInspectionData() {
  const [
    children, staff, safeguarding, missing, incidents, complaints,
    notifications, actions, voices, outcomes, training, supervisions, policies
  ] = await Promise.all([
    db.select().from(childrenTable),
    db.select().from(staffTable),
    db.select().from(safeguardingEventsTable),
    db.select().from(missingEpisodesTable),
    db.select().from(incidentsTable),
    db.select().from(complaintsTable),
    db.select().from(notificationsTable),
    db.select().from(regulationActionsTable),
    db.select().from(childVoiceTable),
    db.select().from(outcomesTable),
    db.select().from(trainingTable),
    db.select().from(supervisionsTable),
    db.select().from(policiesTable),
  ]);

  const today = new Date();
  const currentChildren = children.filter(c => c.status === "current");
  const activeStaff = staff.filter(s => s.status === "active");

  const dbsCompliant = activeStaff.filter(s => computeDbsStatus(s.dbsExpiryDate) === "valid").length;
  const dbsExpiringSoon = activeStaff.filter(s => computeDbsStatus(s.dbsExpiryDate) === "expiring_soon").length;
  const dbsExpired = activeStaff.filter(s => computeDbsStatus(s.dbsExpiryDate) === "expired").length;
  const trainingCompliant = activeStaff.filter(s => s.mandatoryTrainingComplete).length;
  const supervisionOverdue = activeStaff.filter(s => {
    if (!s.lastSupervisionDate) return true;
    return Math.floor((today.getTime() - new Date(s.lastSupervisionDate).getTime()) / (1000 * 60 * 60 * 24)) > 84;
  }).length;

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

  const evidenceGaps: any[] = [];
  let gapId = 1;

  for (const child of currentChildren) {
    const childVoices = voices.filter(v => v.childId === child.id);
    const lastVoice = childVoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (!lastVoice) {
      evidenceGaps.push({ id: gapId++, domain: "children_outcomes", area: "Child Voice", description: `No child voice evidence recorded for ${child.firstName} ${child.lastName}`, severity: "high", childId: child.id, childName: `${child.firstName} ${child.lastName}`, recommendation: "Record wishes and feelings session within 7 days", daysOverdue: null });
    } else {
      const daysSince = Math.floor((today.getTime() - new Date(lastVoice.date).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 21) {
        evidenceGaps.push({ id: gapId++, domain: "children_outcomes", area: "Child Voice", description: `Child voice not evidenced in ${daysSince} days for ${child.firstName} ${child.lastName}`, severity: daysSince > 30 ? "high" : "medium", childId: child.id, childName: `${child.firstName} ${child.lastName}`, recommendation: "Conduct key work session and record wishes and feelings", daysOverdue: daysSince - 21 });
      }
    }
  }

  for (const episode of missing.filter(m => !m.returnInterviewCompleted)) {
    const child = children.find(c => c.id === episode.childId);
    evidenceGaps.push({ id: gapId++, domain: "safeguarding", area: "Return Interview", description: `Return interview not completed for missing episode`, severity: "critical", childId: episode.childId, childName: child ? `${child.firstName} ${child.lastName}` : null, recommendation: "Complete return interview within 72 hours of return", daysOverdue: 1 });
  }

  for (const s of activeStaff.filter(m => computeDbsStatus(m.dbsExpiryDate) === "expired")) {
    evidenceGaps.push({ id: gapId++, domain: "workforce", area: "DBS Check", description: `DBS certificate expired for ${s.firstName} ${s.lastName}`, severity: "critical", childId: null, childName: null, recommendation: "Arrange immediate DBS renewal. Review deployment until resolved.", daysOverdue: null });
  }

  const overduePolices = policies.filter(p => new Date(p.nextReviewDate) < today);
  for (const p of overduePolices) {
    evidenceGaps.push({ id: gapId++, domain: "governance", area: "Policy Review", description: `Policy "${p.title}" is overdue for review`, severity: "medium", childId: null, childName: null, recommendation: "Schedule and complete policy review. Update version number and sign off.", daysOverdue: Math.floor((today.getTime() - new Date(p.nextReviewDate).getTime()) / (1000 * 60 * 60 * 24)) });
  }

  const openSafeguarding = safeguarding.filter(e => e.status === "open" && (e.riskLevel === "high" || e.riskLevel === "critical"));
  for (const e of openSafeguarding) {
    const child = children.find(c => c.id === e.childId);
    evidenceGaps.push({ id: gapId++, domain: "safeguarding", area: "Safeguarding Action", description: `High/critical safeguarding event remains open without resolution`, severity: "high", childId: e.childId, childName: child ? `${child.firstName} ${child.lastName}` : null, recommendation: "Review safeguarding event and update with action taken and outcome", daysOverdue: null });
  }

  const annexGaps: string[] = [];
  if (missing.filter(m => !m.returnInterviewCompleted).length > 0) annexGaps.push("Return interviews incomplete for missing episodes");
  if (dbsExpired > 0) annexGaps.push(`${dbsExpired} expired DBS certificate(s)`);
  if (overduePolices.length > 0) annexGaps.push(`${overduePolices.length} overdue policy review(s)`);

  const completenessScore = Math.max(40, 100 - annexGaps.length * 15 - evidenceGaps.filter(g => g.severity === "critical").length * 10);

  return {
    children: currentChildren,
    activeStaff,
    safeguarding,
    missing,
    incidents,
    complaints,
    notifications,
    actions,
    outcomes,
    evidenceGaps,
    byArea,
    workforceData: { dbsCompliant, dbsExpiringSoon, dbsExpired, trainingCompliant, supervisionOverdue, totalStaff: activeStaff.length },
    annexGaps,
    completenessScore,
  };
}

router.get("/pack", async (req, res) => {
  try {
    const data = await buildInspectionData();
    const { children, activeStaff, safeguarding, missing, incidents, complaints, notifications, actions, outcomes, evidenceGaps, byArea, workforceData, annexGaps, completenessScore } = data;

    const today = new Date();
    const openComplaints = complaints.filter(c => c.status === "open").length;
    const overallOutcomes = outcomes.length > 0 ? (outcomes.filter(o => o.progress === "improving").length > outcomes.length * 0.5 ? "Generally improving" : "Mixed") : "No data";

    const domainScores = [
      { domain: "children_outcomes", label: "Children & Outcomes", score: 82, trend: "up", alertCount: 0, riskLevel: "low" },
      { domain: "safeguarding", label: "Safeguarding", score: Math.max(60, 95 - safeguarding.filter(e => e.status === "open").length * 5), trend: "stable", alertCount: missing.filter(m => !m.returnInterviewCompleted).length, riskLevel: "medium" },
      { domain: "workforce", label: "Workforce Compliance", score: Math.max(60, 95 - workforceData.dbsExpired * 15 - workforceData.supervisionOverdue * 5), trend: "stable", alertCount: workforceData.dbsExpiringSoon, riskLevel: workforceData.dbsExpired > 0 ? "high" : "medium" },
      { domain: "leadership", label: "Leadership & Management", score: 79, trend: "stable", alertCount: 0, riskLevel: "medium" },
      { domain: "documentation", label: "Documentation Quality", score: 88, trend: "up", alertCount: 0, riskLevel: "low" },
      { domain: "governance", label: "Governance", score: Math.max(60, 95 - openComplaints * 5), trend: "stable", alertCount: openComplaints, riskLevel: openComplaints > 3 ? "high" : "low" },
      { domain: "environment", label: "Environment", score: 95, trend: "up", alertCount: 0, riskLevel: "low" },
    ] as const;

    const overallScore = Math.round(domainScores.reduce((s, d) => s + d.score, 0) / domainScores.length);

    res.json({
      generatedAt: today.toISOString(),
      overallScore,
      domains: domainScores,
      annex: {
        generatedAt: today.toISOString(),
        period: `${new Date(today.getFullYear(), today.getMonth() - 6).toLocaleDateString("en-GB")} – ${today.toLocaleDateString("en-GB")}`,
        admissions: children.filter(c => new Date(c.admissionDate) > new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000)).length,
        discharges: 0,
        incidents: incidents.length,
        missingEpisodes: missing.length,
        safeguardingEvents: safeguarding.length,
        staffChanges: 0,
        complaints: complaints.filter(c => c.type === "complaint").length,
        notifications: notifications.length,
        completenessScore,
        gaps: annexGaps,
      },
      workforce: { overallScore: Math.max(50, 95 - workforceData.dbsExpired * 15), ...workforceData, appraisalOverdue: 0 },
      safeguarding: { totalEvents: safeguarding.length, openEvents: safeguarding.filter(e => e.status === "open").length, missingEpisodes: missing.length },
      complaints: { total: complaints.length, open: complaints.filter(c => c.status === "open").length, resolved: complaints.filter(c => c.status === "resolved").length },
      childOutcomes: { byArea, overallProgress: overallOutcomes },
      actionPlan: actions.filter(a => a.status === "outstanding" || a.status === "in_progress").map(a => ({ ...a, completedAt: a.completedAt?.toISOString() ?? null })),
      riskSummary: evidenceGaps,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to generate inspection pack" });
  }
});

router.get("/annex-a", async (req, res) => {
  try {
    const data = await buildInspectionData();
    const { children, safeguarding, missing, incidents, complaints, notifications, annexGaps, completenessScore } = data;
    const today = new Date();

    res.json({
      generatedAt: today.toISOString(),
      period: `${new Date(today.getFullYear(), today.getMonth() - 6).toLocaleDateString("en-GB")} – ${today.toLocaleDateString("en-GB")}`,
      admissions: children.filter(c => new Date(c.admissionDate) > new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000)).length,
      discharges: 0,
      incidents: incidents.length,
      missingEpisodes: missing.length,
      safeguardingEvents: safeguarding.length,
      staffChanges: 0,
      complaints: complaints.filter(c => c.type === "complaint").length,
      notifications: notifications.length,
      completenessScore,
      gaps: annexGaps,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to generate Annex A" });
  }
});

router.get("/evidence-gaps", async (req, res) => {
  try {
    const data = await buildInspectionData();
    res.json(data.evidenceGaps);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch evidence gaps" });
  }
});

export default router;
