import React from "react";
import { useListRegulation44, useListRegulation45, useListOutstandingActions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardCheck, CalendarClock, AlertCircle, FileText } from "lucide-react";
import { Regulation44VisitOverallFinding, RegulationActionStatus } from "@workspace/api-client-react";

export function Regulation() {
  const { data: reg44, isLoading: loadingReg44 } = useListRegulation44();
  const { data: reg45, isLoading: loadingReg45 } = useListRegulation45();
  const { data: actions, isLoading: loadingActions } = useListOutstandingActions();

  if (loadingReg44 || loadingReg45 || loadingActions) {
    return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-[400px]" /></div>;
  }

  const getFindingBadge = (finding: Regulation44VisitOverallFinding) => {
    switch(finding) {
      case 'satisfactory': return <Badge className="bg-emerald-500 hover:bg-emerald-600">Satisfactory</Badge>;
      case 'requires_improvement': return <Badge className="bg-amber-500 hover:bg-amber-600">Requires Improvement</Badge>;
      case 'inadequate': return <Badge variant="destructive">Inadequate</Badge>;
      default: return <Badge variant="outline">{finding}</Badge>;
    }
  };

  const getActionStatusBadge = (status: RegulationActionStatus) => {
    switch(status) {
      case 'outstanding': return <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">Outstanding</Badge>;
      case 'in_progress': return <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">In Progress</Badge>;
      case 'completed': return <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">Completed</Badge>;
      case 'escalated': return <Badge variant="destructive">Escalated</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Regulation 44 & 45</h1>
        <p className="text-muted-foreground mt-1">Independent visitor reports, quality of care reviews, and associated action plans.</p>
      </div>

      <Tabs defaultValue="actions" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="actions">Outstanding Actions</TabsTrigger>
          <TabsTrigger value="reg44">Regulation 44</TabsTrigger>
          <TabsTrigger value="reg45">Regulation 45</TabsTrigger>
        </TabsList>
        
        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Action Plan Tracker</CardTitle>
              <CardDescription>Consolidated actions from Reg 44 visits, Reg 45 reviews, and Ofsted inspections.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead className="hidden sm:table-cell">Source</TableHead>
                    <TableHead className="hidden md:table-cell">Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Evidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions?.map(action => (
                    <TableRow key={action.id}>
                      <TableCell>
                        <div className="font-medium text-sm text-slate-800">{action.title}</div>
                        <div className="sm:hidden mt-1">{getActionStatusBadge(action.status)}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">{action.source}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{action.assignedTo || 'Unassigned'}</TableCell>
                      <TableCell className="text-sm">
                        {action.dueDate ? (() => {
                          const daysOverdue = Math.floor((Date.now() - new Date(action.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                          return (
                            <div>
                              <span className={daysOverdue > 0 ? "text-destructive font-medium" : ""}>{new Date(action.dueDate).toLocaleDateString('en-GB')}</span>
                              {daysOverdue > 0 && action.status !== 'completed' && (
                                <div className="text-[10px] font-semibold text-destructive mt-0.5">{daysOverdue}d overdue</div>
                              )}
                            </div>
                          );
                        })() : 'None'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{getActionStatusBadge(action.status)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {action.evidenceUploaded ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><FileText className="w-3 h-3"/> Uploaded</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-600"><AlertCircle className="w-3 h-3"/> Missing</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!actions || actions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center p-8 text-slate-500">No outstanding actions found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reg44">
           <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {reg44?.map(visit => (
                  <div key={visit.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-lg text-slate-800">Visit: {new Date(visit.visitDate).toLocaleDateString()}</span>
                          {getFindingBadge(visit.overallFinding)}
                        </div>
                        <p className="text-sm text-slate-500">Conducted by: <span className="font-medium text-slate-700">{visit.conductedBy}</span></p>
                      </div>
                      <Badge variant="outline" className="bg-slate-50">Next due: {new Date(visit.nextDueDate).toLocaleDateString()}</Badge>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-md text-sm text-slate-700 border border-slate-100">
                      {visit.summary}
                    </div>
                  </div>
                ))}
                {(!reg44 || reg44.length === 0) && (
                  <div className="p-12 text-center text-slate-500">No Regulation 44 visits recorded.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reg45">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Review Date</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Quality Rating</TableHead>
                    <TableHead>Completed By</TableHead>
                    <TableHead>Actions Raised</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reg45?.map(review => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">{new Date(review.reviewDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm text-slate-600">{review.period}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{review.qualityRating.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{review.completedBy}</TableCell>
                      <TableCell className="text-sm font-medium text-amber-600">{review.actionsRaised}</TableCell>
                    </TableRow>
                  ))}
                  {(!reg45 || reg45.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center p-8 text-slate-500">No Regulation 45 reviews recorded.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
