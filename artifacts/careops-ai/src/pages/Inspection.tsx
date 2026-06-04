import React from "react";
import { useGetInspectionPack, useGetAnnexA } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download, SearchCheck, CheckCircle2, AlertTriangle, ShieldAlert, FileText, ClipboardList } from "lucide-react";

export function Inspection() {
  const { data: pack, isLoading: loadingPack, dataUpdatedAt } = useGetInspectionPack();
  const { data: annex, isLoading: loadingAnnex } = useGetAnnexA();
  const refreshedAt = dataUpdatedAt ? new Date(dataUpdatedAt) : new Date();

  if (loadingPack || loadingAnnex) {
    return <div className="space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-32 w-full" /><Skeleton className="h-[400px]" /></div>;
  }

  if (!pack || !annex) return <div>Data unavailable</div>;

  const isReady = pack.overallScore >= 90;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-primary text-primary-foreground">
              <SearchCheck size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Inspection War-Room</h1>
          </div>
          <p className="text-muted-foreground mt-1 max-w-2xl">One-click, comprehensive view of your entire compliance position, designed to be presented directly to an inspector.</p>
          <p className="text-xs text-slate-400 mt-2">
            Data refreshed: {refreshedAt.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-primary text-primary">
            <FileText className="mr-2 h-4 w-4" />
            Export Annex A
          </Button>
          <Button className="bg-primary text-primary-foreground">
            <Download className="mr-2 h-4 w-4" />
            Download Full Pack
          </Button>
        </div>
      </div>

      <div className={`p-6 rounded-xl border-2 flex flex-col md:flex-row items-center justify-between gap-6 ${isReady ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-full ${isReady ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            {isReady ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isReady ? 'text-emerald-800' : 'text-amber-800'}`}>
              {isReady ? 'High Confidence: Inspection Ready' : 'Attention Required: Evidence Gaps Identified'}
            </h2>
            <p className={`text-sm mt-1 ${isReady ? 'text-emerald-600' : 'text-amber-600'}`}>
              Overall Readiness Score: <span className="font-bold">{pack.overallScore}%</span>
            </p>
          </div>
        </div>
        {!isReady && (
          <div className="bg-white p-3 rounded-lg border shadow-sm text-sm w-full md:w-auto max-w-sm">
            <p className="font-semibold text-slate-800 mb-1">Top Priorities:</p>
            <ul className="list-disc pl-4 text-slate-600 space-y-1">
              <li>Resolve 2 critical safeguarding alerts</li>
              <li>Complete 3 overdue staff supervisions</li>
              <li>Upload missing Reg 44 report</li>
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Annex A Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
               <span className="text-sm font-medium text-slate-600">Completeness</span>
               <div className="flex items-center gap-2">
                 <div className="w-32 bg-slate-200 rounded-full h-2">
                   <div className="bg-primary h-2 rounded-full" style={{width: `${annex.completenessScore}%`}}></div>
                 </div>
                 <span className="text-sm font-bold text-slate-800">{annex.completenessScore}%</span>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-px bg-slate-100">
               <div className="bg-white p-4">
                 <div className="text-2xl font-bold text-slate-800 mb-1">{annex.admissions}</div>
                 <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Admissions</div>
               </div>
               <div className="bg-white p-4">
                 <div className="text-2xl font-bold text-slate-800 mb-1">{annex.discharges}</div>
                 <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Discharges</div>
               </div>
               <div className="bg-white p-4">
                 <div className="text-2xl font-bold text-slate-800 mb-1">{annex.safeguardingEvents}</div>
                 <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Safeguarding</div>
               </div>
               <div className="bg-white p-4">
                 <div className="text-2xl font-bold text-slate-800 mb-1">{annex.incidents}</div>
                 <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Incidents</div>
               </div>
             </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Outstanding Risk Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {pack.riskSummary.length === 0 ? (
                <p className="text-slate-500 text-sm italic">No significant risks identified.</p>
              ) : (
                pack.riskSummary.slice(0, 6).map((risk: any, idx: number) => (
                  <div key={idx} className="flex gap-3 text-sm border-b last:border-0 pb-3 last:pb-0">
                    <div className="mt-0.5 shrink-0">
                      <AlertTriangle className={`w-4 h-4 ${risk.severity === 'critical' ? 'text-red-500' : risk.severity === 'high' ? 'text-amber-500' : 'text-yellow-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${risk.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{risk.severity}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{risk.domain?.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-slate-700 font-medium">{risk.description}</p>
                      {risk.recommendation && <p className="text-slate-500 text-xs mt-0.5">→ {risk.recommendation}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
