import React from "react";
import { useListIncidents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { IncidentSeverity, IncidentStatus } from "@workspace/api-client-react";

export function Incidents() {
  const { data: incidents, isLoading } = useListIncidents();

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
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'serious': return <Badge className="bg-amber-600 hover:bg-amber-700">Serious</Badge>;
      case 'moderate': return <Badge variant="outline" className="border-amber-400 text-amber-700">Moderate</Badge>;
      case 'minor': return <Badge variant="secondary">Minor</Badge>;
      default: return <Badge>{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'open': return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Open</Badge>;
      case 'under_review': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Reviewing</Badge>;
      case 'closed': return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">Closed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Incident Log</h1>
        <p className="text-muted-foreground mt-1">Record, track, and review incidents involving young people.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Child</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notification</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents?.map(incident => (
                  <TableRow key={incident.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-sm font-medium whitespace-nowrap">
                      {new Date(incident.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-800">{incident.title}</div>
                      <div className="text-xs text-slate-500 capitalize">{incident.type.replace(/_/g, ' ')}</div>
                    </TableCell>
                    <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                    <TableCell className="text-sm text-slate-700">{incident.childName || '-'}</TableCell>
                    <TableCell>{getStatusBadge(incident.status)}</TableCell>
                    <TableCell>
                      {incident.notificationRequired ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded w-fit border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          Required
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Not Required</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <button className="text-primary text-sm font-medium hover:underline">Review</button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!incidents || incidents.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                      No incidents recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
