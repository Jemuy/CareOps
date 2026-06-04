import React, { useState } from "react";
import { Link } from "wouter";
import { useListSafeguardingEvents, useListMissingEpisodes } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, AlertCircle, CheckCircle, FileText, MapPin, Clock, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogSafeguardingModal } from "@/components/modals/LogSafeguardingModal";

export function Safeguarding() {
  const { data: events, isLoading: loadingEvents } = useListSafeguardingEvents();
  const { data: missing, isLoading: loadingMissing } = useListMissingEpisodes();
  const [showLog, setShowLog] = useState(false);

  const isLoading = loadingEvents || loadingMissing;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const openEvents = events?.filter(e => e.status === "open" || e.status === "actioned").length ?? 0;
  const openMissing = missing?.filter(m => !m.returnedAt).length ?? 0;
  const interviewsOutstanding = missing?.filter(m => m.returnedAt && !m.returnInterviewCompleted).length ?? 0;

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-destructive text-white border-transparent";
      case "high": return "bg-amber-500 text-white border-transparent";
      case "medium": return "bg-amber-100 text-amber-800 border-amber-200";
      case "low": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case "open":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-sm font-medium text-rose-700">
            <AlertCircle className="w-3.5 h-3.5" /> Open
          </div>
        );
      case "actioned":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-sm font-medium text-blue-700">
            <FileText className="w-3.5 h-3.5" /> Actioned
          </div>
        );
      case "closed":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-700">
            <CheckCircle className="w-3.5 h-3.5" /> Closed
          </div>
        );
      case "escalated":
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/30 text-sm font-medium text-destructive">
            <ShieldAlert className="w-3.5 h-3.5" /> Escalated
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border text-sm font-medium capitalize">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> {status}
          </div>
        );
    }
  };

  const formatDuration = (from: string, to?: string | null) => {
    const start = new Date(from);
    const end = to ? new Date(to) : new Date();
    const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h`;
    return `${Math.round(hours / 24)}d ${hours % 24}h`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Safeguarding Log</h1>
          <p className="text-muted-foreground mt-1">Track and manage all safeguarding events, CP concerns, and missing episodes.</p>
        </div>
        <Button onClick={() => setShowLog(true)} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Record Event
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Open Events</p>
              <p className={`text-3xl font-bold ${openEvents > 0 ? "text-rose-600" : "text-emerald-600"}`}>{openEvents}</p>
            </div>
            <div className={`p-3 rounded-full ${openEvents > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
              <ShieldAlert size={22} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Currently Missing</p>
              <p className={`text-3xl font-bold ${openMissing > 0 ? "text-amber-600" : "text-emerald-600"}`}>{openMissing}</p>
            </div>
            <div className={`p-3 rounded-full ${openMissing > 0 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
              <MapPin size={22} />
            </div>
          </CardContent>
        </Card>
        <Card className={`border-slate-200 ${interviewsOutstanding > 0 ? "bg-rose-50 border-rose-200" : "bg-slate-50"}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Return Interviews Due</p>
              <p className={`text-3xl font-bold ${interviewsOutstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>{interviewsOutstanding}</p>
            </div>
            <div className={`p-3 rounded-full ${interviewsOutstanding > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
              <Clock size={22} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="events">
            Safeguarding Events
            {openEvents > 0 && (
              <span className="ml-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{openEvents}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="missing">
            Missing Episodes
            {interviewsOutstanding > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{interviewsOutstanding}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y border-t mt-4">
                {events?.map(event => (
                  <div key={event.id} className="p-4 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className={getRiskColor(event.riskLevel)}>
                          {event.riskLevel.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {event.type.replace(/_/g, " ")}
                        </Badge>
                        {event.notificationRequired && !event.notificationSent && (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 animate-pulse">
                            ⚠ Notification Overdue
                          </Badge>
                        )}
                        {event.notificationRequired && event.notificationSent && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            ✓ Notification Sent
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-slate-800 mb-0.5">
                        {event.childName || `Child ID: ${event.childId}`}
                      </h3>
                      <p className="text-slate-600 text-sm line-clamp-2">{event.description}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>Date: {new Date(event.date).toLocaleDateString("en-GB")}</span>
                        <span>Reported by: {event.reportedBy}</span>
                        {event.actionTaken && (
                          <span className="text-emerald-600 font-medium">Action taken recorded</span>
                        )}
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                      {getStatusPill(event.status)}
                      {event.childId && (
                        <Link href={`/children/${event.childId}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                          View Profile <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
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
        </TabsContent>

        <TabsContent value="missing">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y border-t mt-4">
                {missing?.map(episode => (
                  <div key={episode.id} className="p-4 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row gap-4 sm:items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className={getRiskColor(episode.riskLevel)}>
                          {episode.riskLevel.toUpperCase()}
                        </Badge>
                        {!episode.returnedAt && (
                          <Badge variant="destructive" className="animate-pulse">Currently Missing</Badge>
                        )}
                        {episode.returnedAt && !episode.returnInterviewCompleted && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            ⚠ Return Interview Outstanding
                          </Badge>
                        )}
                        {episode.returnInterviewCompleted && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            ✓ Return Interview Done
                          </Badge>
                        )}
                        {episode.reportedToPolice && (
                          <Badge variant="secondary" className="text-[10px]">Police Notified{episode.policeRef ? ` · ${episode.policeRef}` : ""}</Badge>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-slate-800 mb-0.5">
                        {(episode as any).childName || `Child ID: ${episode.childId}`}
                      </h3>
                      {episode.circumstances && (
                        <p className="text-slate-600 text-sm line-clamp-2 mb-2">{episode.circumstances}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span>Missing from: {new Date(episode.missingFrom).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
                        {episode.returnedAt ? (
                          <>
                            <span>Returned: {new Date(episode.returnedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
                            <span className="font-medium text-slate-600">Duration: {formatDuration(episode.missingFrom, episode.returnedAt)}</span>
                          </>
                        ) : (
                          <span className="font-semibold text-rose-600">Missing for: {formatDuration(episode.missingFrom)}</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {episode.childId && (
                        <Link href={`/children/${episode.childId}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                          View Profile <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
                {(!missing || missing.length === 0) && (
                  <div className="p-12 text-center text-slate-500">
                    <MapPin className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p>No missing episodes recorded.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LogSafeguardingModal open={showLog} onClose={() => setShowLog(false)} />
    </div>
  );
}
