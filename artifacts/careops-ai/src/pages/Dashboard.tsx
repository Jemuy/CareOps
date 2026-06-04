import React from "react";
import { useGetDashboardSummary, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, RadialBarChart, RadialBar, Tooltip } from "recharts";
import { AlertTriangle, CheckCircle, Clock, Users, ArrowUpRight, ArrowDownRight, Minus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DomainScoreRiskLevel } from "@workspace/api-client-react";

export function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity();

  if (loadingSummary || loadingActivity) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!summary) return <div>Failed to load dashboard</div>;

  const statCards = [
    { title: "Critical Alerts", value: summary.criticalAlerts, icon: AlertTriangle, color: "text-destructive" },
    { title: "Overdue Actions", value: summary.overdueActions, icon: Clock, color: "text-amber-500" },
    { title: "Total Children", value: summary.totalChildren, icon: Users, color: "text-primary" },
    { title: "Total Staff", value: summary.totalStaff, icon: CheckCircle, color: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Master Dashboard</h1>
        <p className="text-muted-foreground mt-1">Inspection readiness command centre</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Domain Scores</CardTitle>
              <CardDescription>Ofsted SCCIF Readiness Domains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.domains.map((domain) => (
                  <div key={domain.domain} className="bg-muted border border-border p-4 rounded-lg flex flex-col gap-2 relative overflow-hidden">
                    {domain.riskLevel === DomainScoreRiskLevel.critical && (
                       <div className="absolute top-0 right-0 w-2 h-full bg-destructive"></div>
                    )}
                    {domain.riskLevel === DomainScoreRiskLevel.high && (
                       <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
                    )}
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-foreground/90 max-w-[70%]">{domain.label}</span>
                      {domain.trend === 'up' && <ArrowUpRight className="text-emerald-500 w-4 h-4" />}
                      {domain.trend === 'down' && <ArrowDownRight className="text-destructive w-4 h-4" />}
                      {domain.trend === 'stable' && <Minus className="text-muted-foreground w-4 h-4" />}
                    </div>
                    <div className="flex items-end gap-2 mt-2">
                      <span className="text-2xl font-bold">{domain.score}%</span>
                    </div>
                    {domain.alertCount > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded w-fit">
                        <AlertCircle className="w-3 h-3" />
                        {domain.alertCount} alerts
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activity?.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${
                        item.severity === 'critical' ? 'bg-destructive' : 
                        item.severity === 'high' ? 'bg-amber-500' : 'bg-primary'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-muted-foreground text-xs">{new Date(item.timestamp).toLocaleDateString()}</span>
                        <Badge variant="outline" className="text-[10px] uppercase">{item.domain}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
