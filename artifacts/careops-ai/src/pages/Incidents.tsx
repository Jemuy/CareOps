import React, { useState } from "react";
import { useListIncidents } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, ClipboardList, Plus } from "lucide-react";
import { IncidentSeverity, IncidentStatus } from "@workspace/api-client-react";
import { LogIncidentModal } from "@/components/modals/LogIncidentModal";

export function Incidents() {
  const { data: incidents, isLoading } = useListIncidents();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showLog, setShowLog] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case "critical": return <Badge variant="destructive">Critical</Badge>;
      case "serious": return <Badge className="bg-amber-600 hover:bg-amber-700">Serious</Badge>;
      case "moderate": return <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-400 dark:border-amber-600">Moderate</Badge>;
      case "minor": return <Badge variant="secondary">Minor</Badge>;
      default: return <Badge>{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case "open": return <Badge variant="outline" className="bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-700">Open</Badge>;
      case "under_review": return <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700">Reviewing</Badge>;
      case "closed": return <Badge variant="secondary">Closed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const openCount = incidents?.filter(i => i.status === "open").length ?? 0;
  const notificationPending = incidents?.filter(i => i.notificationRequired && !i.notificationSent).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incident Log</h1>
          <p className="text-muted-foreground mt-1">Record, track, and review incidents involving young people.</p>
        </div>
        <div className="flex items-center gap-3">
          {notificationPending > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-sm font-medium px-3 py-2 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              {notificationPending} notification{notificationPending > 1 ? "s" : ""} pending
            </div>
          )}
          {openCount > 0 && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-400 text-sm font-medium px-3 py-2 rounded-lg">
              <ClipboardList className="w-4 h-4" />
              {openCount} open
            </div>
          )}
          <Button onClick={() => setShowLog(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Log Incident
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-[90px]">Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="hidden sm:table-cell">Child</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Notification</TableHead>
                  <TableHead className="text-right w-[60px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents?.map(incident => (
                  <React.Fragment key={incident.id}>
                    <TableRow
                      className={`hover:bg-muted/50 cursor-pointer ${expandedId === incident.id ? "bg-muted/50" : ""}`}
                      onClick={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
                    >
                      <TableCell className="text-sm font-medium whitespace-nowrap">
                        {new Date(incident.date).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground text-sm">{incident.title}</div>
                        <div className="text-xs text-muted-foreground capitalize">{incident.type.replace(/_/g, " ")}</div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-foreground/80">{(incident as any).childName || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell">{getStatusBadge(incident.status)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {incident.notificationRequired ? (
                          <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded w-fit border ${
                            incident.notificationSent
                              ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700"
                              : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700"
                          }`}>
                            {incident.notificationSent ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {incident.notificationSent ? "Sent" : "Required"}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not Required</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          {expandedId === incident.id
                            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {expandedId === incident.id && (
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableCell colSpan={7} className="px-6 pb-5 pt-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Description</p>
                              <p className="text-sm text-foreground/80">{incident.description}</p>
                            </div>
                            {incident.notificationRequired && (
                              <div className={`rounded-lg p-3 border ${
                                incident.notificationSent
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                                  : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                              }`}>
                                <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                                  incident.notificationSent
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : "text-amber-700 dark:text-amber-400"
                                }`}>
                                  {incident.notificationSent ? "✓ Ofsted Notification Sent" : "⚠ Ofsted Notification Required"}
                                </p>
                                <p className="text-xs text-foreground/70 mb-2">{incident.notificationReason}</p>
                                {!incident.notificationSent && incident.notificationSuggestedWording && (
                                  <>
                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Suggested wording:</p>
                                    <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-3">{incident.notificationSuggestedWording}</p>
                                  </>
                                )}
                              </div>
                            )}
                            {incident.followUpActions && (
                              <div className="md:col-span-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Follow-up Actions</p>
                                <p className="text-sm text-foreground/80">{incident.followUpActions}</p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
                {(!incidents || incidents.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No incidents recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <LogIncidentModal open={showLog} onClose={() => setShowLog(false)} />
    </div>
  );
}
