import React, { useState } from "react";
import { Link } from "wouter";
import { useListStaff, useGetWorkforceComplianceSummary } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, UserPlus, ChevronRight, ShieldAlert, GraduationCap, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import { StaffMemberDbsStatus, StaffMemberStatus } from "@workspace/api-client-react";
import { AddStaffModal } from "@/components/modals/AddStaffModal";

export function Workforce() {
  const { data: staff, isLoading: loadingStaff } = useListStaff();
  const { data: summary, isLoading: loadingSummary } = useGetWorkforceComplianceSummary();
  const [showAddStaff, setShowAddStaff] = useState(false);

  if (loadingStaff || loadingSummary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  const getDbsBadge = (status: StaffMemberDbsStatus) => {
    switch (status) {
      case "valid": return <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700">Valid</Badge>;
      case "expiring_soon": return <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">Expiring Soon</Badge>;
      case "expired": return <Badge variant="destructive">Expired</Badge>;
      case "pending": return <Badge variant="secondary">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusBadge = (status?: StaffMemberStatus) => {
    switch (status) {
      case "active": return <Badge className="bg-primary hover:bg-primary/90">Active</Badge>;
      case "on_leave": return <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">On Leave</Badge>;
      case "left": return <Badge variant="secondary">Left</Badge>;
      default: return null;
    }
  };

  const supervisionWarning = (member: typeof staff[0]) => {
    if (!member.lastSupervisionDate) return "no-supervision";
    const daysSince = Math.floor((Date.now() - new Date(member.lastSupervisionDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 84) return "overdue";
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workforce Compliance</h1>
          <p className="text-muted-foreground mt-1">Manage staff compliance, DBS checks, and training records.</p>
        </div>
        <Button onClick={() => setShowAddStaff(true)} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Overall Score</p>
                <h3 className={`text-3xl font-bold ${summary.overallScore >= 80 ? "text-emerald-600 dark:text-emerald-400" : summary.overallScore >= 60 ? "text-amber-600 dark:text-amber-400" : "text-destructive"}`}>
                  {summary.overallScore}%
                </h3>
              </div>
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <CheckCircle size={24} />
              </div>
            </CardContent>
          </Card>
          <Card className={summary.dbsExpired + summary.dbsExpiringSoon > 0 ? "border-rose-300 dark:border-rose-800" : ""}>
            <CardContent className={`p-4 flex items-center justify-between rounded-xl ${summary.dbsExpired + summary.dbsExpiringSoon > 0 ? "bg-rose-50 dark:bg-rose-950/40" : ""}`}>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">DBS Issues</p>
                <h3 className={`text-3xl font-bold ${summary.dbsExpired + summary.dbsExpiringSoon > 0 ? "text-destructive" : "text-foreground"}`}>
                  {summary.dbsExpired + summary.dbsExpiringSoon}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{summary.dbsExpired} expired{summary.dbsExpiringSoon > 0 ? `, ${summary.dbsExpiringSoon} expiring` : ""}</p>
              </div>
              <div className={`p-3 rounded-full ${summary.dbsExpired > 0 ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"}`}>
                <ShieldAlert size={24} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Training Compliant</p>
                <h3 className="text-3xl font-bold text-foreground">{summary.trainingCompliant}</h3>
                <p className="text-xs text-muted-foreground mt-1">of {summary.totalStaff} staff</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <GraduationCap size={24} />
              </div>
            </CardContent>
          </Card>
          <Card className={summary.supervisionOverdue > 0 ? "border-amber-300 dark:border-amber-800" : ""}>
            <CardContent className={`p-4 flex items-center justify-between rounded-xl ${summary.supervisionOverdue > 0 ? "bg-amber-50 dark:bg-amber-950/40" : ""}`}>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Overdue Supervisions</p>
                <h3 className={`text-3xl font-bold ${summary.supervisionOverdue > 0 ? "text-amber-700 dark:text-amber-400" : "text-foreground"}`}>
                  {summary.supervisionOverdue}
                </h3>
              </div>
              <div className={`p-3 rounded-full ${summary.supervisionOverdue > 0 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>
                <Calendar size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <TooltipProvider>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Role</TableHead>
                    <TableHead className="hidden lg:table-cell">Compliance Score</TableHead>
                    <TableHead>DBS Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Mandatory Training</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff?.map(member => {
                    const supWarn = supervisionWarning(member);
                    return (
                      <TableRow key={member.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center font-bold text-xs shrink-0">
                              {member.firstName[0]}{member.lastName[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                {member.firstName} {member.lastName}
                                {supWarn && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertTriangle className={`w-3.5 h-3.5 ${supWarn === "no-supervision" ? "text-rose-500" : "text-amber-500"}`} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {supWarn === "no-supervision"
                                        ? "No supervision on record — schedule urgently"
                                        : `Supervision overdue (last: ${new Date(member.lastSupervisionDate!).toLocaleDateString("en-GB")})`}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              {supWarn === "no-supervision" && (
                                <div className="text-[10px] text-rose-500 font-medium mt-0.5">No supervision recorded</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{getStatusBadge(member.status)}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{member.role}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-muted rounded-full h-2 max-w-[100px]">
                              <div
                                className={`h-2 rounded-full ${member.complianceScore >= 90 ? "bg-emerald-500" : member.complianceScore >= 70 ? "bg-amber-500" : "bg-destructive"}`}
                                style={{ width: `${member.complianceScore}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">{member.complianceScore}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getDbsBadge(member.dbsStatus)}
                          {member.dbsExpiryDate && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                              Exp: {new Date(member.dbsExpiryDate).toLocaleDateString("en-GB")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {member.mandatoryTrainingComplete ? (
                            <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700">Complete</Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">Incomplete</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/workforce/${member.id}`}>
                              View Profile <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!staff || staff.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No staff members found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>

      <AddStaffModal open={showAddStaff} onClose={() => setShowAddStaff(false)} />
    </div>
  );
}
