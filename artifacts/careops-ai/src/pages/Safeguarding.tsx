import React from "react";
import { useListSafeguardingEvents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, AlertCircle, CheckCircle, FileText } from "lucide-react";

export function Safeguarding() {
  const { data: events, isLoading } = useListSafeguardingEvents();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-destructive text-white border-transparent';
      case 'high': return 'bg-amber-500 text-white border-transparent';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'escalated': return <ShieldAlert className="w-4 h-4 text-destructive" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Safeguarding Log</h1>
        <p className="text-muted-foreground mt-1">Track and manage all safeguarding events, CP concerns, and missing episodes.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y border-t mt-4">
            {events?.map(event => (
              <div key={event.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={getRiskColor(event.riskLevel)}>
                      {event.riskLevel.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {event.type.replace(/_/g, ' ')}
                    </Badge>
                    {event.notificationRequired && (
                      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 ml-auto sm:ml-0">
                        Notification Required
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    {event.childName || `Child ID: ${event.childId}`}
                  </h3>
                  <p className="text-slate-600 text-sm line-clamp-2">{event.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span>Date: {new Date(event.date).toLocaleDateString()}</span>
                    <span>Reporter: {event.reportedBy}</span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border text-sm font-medium capitalize">
                    {getStatusIcon(event.status)}
                    {event.status}
                  </div>
                  <button className="text-sm font-medium text-primary hover:underline ml-auto sm:ml-0">
                    View Details
                  </button>
                </div>
              </div>
            ))}
            {(!events || events.length === 0) && (
              <div className="p-12 text-center text-slate-500">
                <ShieldAlert className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>No safeguarding events recorded.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
