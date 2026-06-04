import React from "react";
import { useParams, Link } from "wouter";
import { useGetChild, useGetChildOutcomes, useGetChildVoice } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit, Activity, Heart, BookOpen, MapPin, Briefcase, Users, MessageSquare } from "lucide-react";
import { ChildRiskLevel, OutcomeArea } from "@workspace/api-client-react";

export function ChildDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0", 10);

  const { data: child, isLoading: loadingChild } = useGetChild(id, { query: { enabled: !!id, queryKey: ['getChild', id] } });
  const { data: outcomes, isLoading: loadingOutcomes } = useGetChildOutcomes(id, { query: { enabled: !!id, queryKey: ['getChildOutcomes', id] } });
  const { data: voiceRecords, isLoading: loadingVoice } = useGetChildVoice(id, { query: { enabled: !!id, queryKey: ['getChildVoice', id] } });

  if (loadingChild) return <div className="space-y-6"><Skeleton className="h-12 w-64" /><Skeleton className="h-64" /></div>;
  if (!child) return <div>Child not found.</div>;

  const getRiskBadge = (level?: ChildRiskLevel) => {
    switch (level) {
      case 'critical': return <Badge variant="destructive" className="px-3 py-1 text-sm">Critical Risk</Badge>;
      case 'high': return <Badge className="bg-amber-500 hover:bg-amber-600 px-3 py-1 text-sm">High Risk</Badge>;
      case 'medium': return <Badge variant="outline" className="border-amber-500 text-amber-700 px-3 py-1 text-sm">Medium Risk</Badge>;
      case 'low': return <Badge variant="outline" className="border-emerald-500 text-emerald-700 px-3 py-1 text-sm">Low Risk</Badge>;
      default: return null;
    }
  };

  const getAreaIcon = (area: OutcomeArea) => {
    switch (area) {
      case 'education': return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'health': return <Activity className="w-4 h-4 text-emerald-500" />;
      case 'relationships': return <Heart className="w-4 h-4 text-rose-500" />;
      case 'independence': return <MapPin className="w-4 h-4 text-indigo-500" />;
      case 'employment': return <Briefcase className="w-4 h-4 text-amber-500" />;
      case 'community': return <Users className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" asChild className="text-slate-500">
          <Link href="/children"><ChevronLeft className="w-4 h-4 mr-1"/> Back to Young People</Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl border border-primary/20">
            {child.firstName[0]}{child.lastName[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{child.firstName} {child.lastName}</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">
              DOB: {new Date(child.dateOfBirth).toLocaleDateString()} • Admitted: {new Date(child.admissionDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getRiskBadge(child.riskLevel)}
          <Button variant="outline"><Edit className="w-4 h-4 mr-2" /> Edit Profile</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Outcomes Tracking</CardTitle>
            <CardDescription>Progress across key development areas</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOutcomes ? <Skeleton className="h-64" /> : (
              <div className="space-y-4">
                {outcomes?.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8 bg-slate-50 rounded-lg border border-dashed">No outcomes recorded yet.</p>
                ) : (
                  outcomes?.map(outcome => (
                    <div key={outcome.id} className="p-4 rounded-lg border bg-card hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getAreaIcon(outcome.area)}
                          <span className="font-semibold capitalize tracking-tight text-slate-800">{outcome.area}</span>
                        </div>
                        <Badge variant="secondary" className={
                          outcome.progress === 'improving' ? 'bg-emerald-100 text-emerald-800' :
                          outcome.progress === 'declining' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-800'
                        }>
                          {outcome.progress?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-xs text-slate-500 font-medium block uppercase mb-1">Current Status</span>
                          <span className="text-slate-700">{outcome.currentStatus}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 font-medium block uppercase mb-1">Next Actions</span>
                          <span className="text-slate-700">{outcome.nextActions || 'None specified'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Key Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-slate-500 block mb-0.5">Key Worker</span>
                <span className="font-medium">{child.keyWorker}</span>
              </div>
              {child.placingAuthority && (
                <div>
                  <span className="text-slate-500 block mb-0.5">Placing Authority</span>
                  <span className="font-medium">{child.placingAuthority}</span>
                </div>
              )}
              {child.localAuthority && (
                <div>
                  <span className="text-slate-500 block mb-0.5">Local Authority</span>
                  <span className="font-medium">{child.localAuthority}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                Child's Voice
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingVoice ? <Skeleton className="h-32" /> : (
                <div className="space-y-3">
                  {voiceRecords?.slice(0,3).map(vr => (
                    <div key={vr.id} className="text-sm p-3 rounded-md bg-slate-50 border border-slate-100">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-slate-800 capitalize">{vr.type.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-slate-500">{new Date(vr.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-600 line-clamp-2">{vr.summary}</p>
                    </div>
                  ))}
                  {(!voiceRecords || voiceRecords.length === 0) && (
                    <p className="text-slate-500 text-sm italic">No voice records found.</p>
                  )}
                  <Button variant="outline" className="w-full text-xs h-8">View All Records</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
