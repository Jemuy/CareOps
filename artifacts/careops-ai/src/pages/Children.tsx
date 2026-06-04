import React, { useState } from "react";
import { Link } from "wouter";
import { useListChildren } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, ChevronRight } from "lucide-react";
import { ChildRiskLevel, ChildStatus } from "@workspace/api-client-react";
import { AdmitChildModal } from "@/components/modals/AdmitChildModal";

export function ChildrenList() {
  const { data: children, isLoading } = useListChildren();
  const [showAdmit, setShowAdmit] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  const getRiskBadge = (level?: ChildRiskLevel) => {
    switch (level) {
      case "critical": return <Badge variant="destructive">Critical Risk</Badge>;
      case "high": return <Badge className="bg-amber-500 hover:bg-amber-600">High Risk</Badge>;
      case "medium": return <Badge variant="outline" className="border-amber-500 text-amber-700">Medium Risk</Badge>;
      case "low": return <Badge variant="outline" className="border-emerald-500 text-emerald-700">Low Risk</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: ChildStatus) => {
    switch (status) {
      case "current": return <Badge className="bg-primary hover:bg-primary/90">Current</Badge>;
      case "planned_discharge": return <Badge variant="outline" className="border-blue-500 text-blue-700">Planned Discharge</Badge>;
      case "discharged": return <Badge variant="secondary">Discharged</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const currentChildren = children?.filter(c => c.status === "current") ?? [];
  const totalChildren = children?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Young People</h1>
          <p className="text-muted-foreground mt-1">
            {currentChildren.length} current placement{currentChildren.length !== 1 ? "s" : ""}
            {totalChildren > currentChildren.length && ` · ${totalChildren - currentChildren.length} discharged`}
          </p>
        </div>
        <Button onClick={() => setShowAdmit(true)} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
          <UserPlus className="mr-2 h-4 w-4" />
          Admit Young Person
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {children && children.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[250px]">Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Key Worker</TableHead>
                    <TableHead>Admission Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {children.map((child) => (
                    <TableRow key={child.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {child.firstName[0]}{child.lastName[0]}
                          </div>
                          <div>
                            {child.firstName} {child.lastName}
                            {child.childVoiceScore !== undefined && child.childVoiceScore !== null && (
                              <div className={`text-[10px] mt-0.5 font-medium ${child.childVoiceScore === 0 ? "text-rose-500" : child.childVoiceScore < 50 ? "text-amber-500" : "text-emerald-600"}`}>
                                Voice: {child.childVoiceScore}%
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(child.status)}</TableCell>
                      <TableCell>{getRiskBadge(child.riskLevel)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{child.keyWorker}</span>
                        {child.lastKeyWorkDate && (
                          <span className="block text-xs text-slate-500 mt-0.5">Last seen: {new Date(child.lastKeyWorkDate).toLocaleDateString("en-GB")}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(child.admissionDate).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/children/${child.id}`}>
                            View Profile <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <h3 className="text-lg font-medium text-foreground">No young people found</h3>
              <p className="text-muted-foreground mt-1 mb-4">There are currently no young people registered in the home.</p>
              <Button onClick={() => setShowAdmit(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Admit First Young Person
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AdmitChildModal open={showAdmit} onClose={() => setShowAdmit(false)} />
    </div>
  );
}
