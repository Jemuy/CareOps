import React, { useState } from "react";
import { useGetAlerts, useUpdateAlert } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertSeverity, AlertStatus } from "@workspace/api-client-react";

export function Alerts() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // NOTE: Assuming query expects params if needed. The backend schema `GetAlertsSeverity` vs string might be tricky, so we'll filter on client for now or pass if supported.
  const { data: alerts, isLoading, refetch } = useGetAlerts();
  const updateAlert = useUpdateAlert();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const filteredAlerts = alerts?.filter(a => {
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  }) || [];

  const handleStatusUpdate = (id: number, newStatus: string) => {
    updateAlert.mutate(
      { id, data: { status: newStatus as any } },
      {
        onSuccess: () => {
          toast({ title: "Alert status updated", description: "The alert has been updated successfully." });
          refetch();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to update alert.", variant: "destructive" });
        }
      }
    );
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case AlertSeverity.critical: return <Badge variant="destructive" className="bg-destructive text-white border-transparent">Critical</Badge>;
      case AlertSeverity.high: return <Badge variant="outline" className="bg-amber-500 text-white border-transparent">High</Badge>;
      case AlertSeverity.medium: return <Badge variant="outline" className="bg-amber-300 text-amber-900 border-transparent">Medium</Badge>;
      case AlertSeverity.low: return <Badge variant="outline" className="bg-slate-200 text-slate-800 border-transparent">Low</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alert Centre</h1>
          <p className="text-muted-foreground mt-1">Manage and resolve compliance and readiness alerts.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full sm:w-[160px] bg-card">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value={AlertSeverity.critical}>Critical</SelectItem>
              <SelectItem value={AlertSeverity.high}>High</SelectItem>
              <SelectItem value={AlertSeverity.medium}>Medium</SelectItem>
              <SelectItem value={AlertSeverity.low}>Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px] bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={AlertStatus.active}>Active</SelectItem>
              <SelectItem value={AlertStatus.in_progress}>In Progress</SelectItem>
              <SelectItem value={AlertStatus.resolved}>Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center p-12 bg-card border rounded-lg border-dashed">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium text-foreground">No alerts found</h3>
            <p className="text-muted-foreground mt-1">All clear! No alerts match your current filters.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <Card key={alert.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className={`w-2 md:w-2 shrink-0 ${
                  alert.severity === 'critical' ? 'bg-destructive' : 
                  alert.severity === 'high' ? 'bg-amber-500' :
                  alert.severity === 'medium' ? 'bg-amber-300' : 'bg-slate-300'
                }`}></div>
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityBadge(alert.severity)}
                        <Badge variant="outline" className="uppercase text-[10px] tracking-wider text-slate-500 bg-slate-50">{alert.domain}</Badge>
                      </div>
                      <h3 className="text-lg font-bold">{alert.title}</h3>
                      <p className="text-slate-600 mt-1">{alert.description}</p>
                    </div>
                    
                    <div className="flex flex-col gap-2 shrink-0 min-w-[140px]">
                      <Select 
                        value={alert.status} 
                        onValueChange={(val) => handleStatusUpdate(alert.id, val)}
                      >
                        <SelectTrigger className={`h-8 text-xs font-semibold ${
                          alert.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          alert.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={AlertStatus.active}>Active</SelectItem>
                          <SelectItem value={AlertStatus.in_progress}>In Progress</SelectItem>
                          <SelectItem value={AlertStatus.resolved}>Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-slate-400 text-right">
                        Created: {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 bg-slate-50 rounded-md p-4 border border-slate-100">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Risk Explanation</span>
                      <p className="text-sm text-slate-700">{alert.riskExplanation}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Regulatory Impact</span>
                      <p className="text-sm text-slate-700">{alert.regulatoryImpact}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">Recommended Action</span>
                      <p className="text-sm text-slate-800 font-medium">{alert.recommendedAction}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
