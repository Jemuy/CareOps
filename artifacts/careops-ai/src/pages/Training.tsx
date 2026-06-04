import React from "react";
import { useListTraining, useListSupervisions, useGetTrainingComplianceSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Calendar, AlertCircle } from "lucide-react";

export function Training() {
  const { data: training, isLoading: loadingTraining } = useListTraining();
  const { data: supervisions, isLoading: loadingSupervisions } = useListSupervisions();
  const { data: summary, isLoading: loadingSummary } = useGetTrainingComplianceSummary();

  if (loadingTraining || loadingSupervisions || loadingSummary) {
    return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-[400px]" /></div>;
  }

  const getTrainingStatusBadge = (status: string) => {
    switch (status) {
      case 'current': return <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-700">Current</Badge>;
      case 'expiring_soon': return <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-700">Expiring Soon</Badge>;
      case 'expired': return <Badge variant="destructive">Expired</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Training & Supervisions</h1>
        <p className="text-muted-foreground mt-1">Monitor mandatory training and supervision schedules.</p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Expired Training</p>
                <h3 className="text-3xl font-bold text-foreground">{summary.mandatoryExpired}</h3>
              </div>
              <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                <AlertCircle size={24} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Overdue Supervisions</p>
                <h3 className="text-3xl font-bold text-foreground">{summary.supervisionsDue}</h3>
              </div>
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <Calendar size={24} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Overdue Appraisals</p>
                <h3 className="text-3xl font-bold text-foreground">{summary.appraisalsDue}</h3>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <GraduationCap size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="training" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="training">Training Records</TabsTrigger>
          <TabsTrigger value="supervisions">Supervisions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="training">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Training Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {training?.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-foreground">{t.staffName}</TableCell>
                      <TableCell className="text-sm">{t.trainingType}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize text-[10px]">{t.category}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(t.completedDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(t.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getTrainingStatusBadge(t.status)}</TableCell>
                    </TableRow>
                  ))}
                  {(!training || training.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">No training records found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supervisions">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Next Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supervisions?.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-foreground">{s.staffName}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize text-[10px]">{s.type.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="text-sm text-foreground/80">{s.supervisorName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(s.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {new Date(s.nextDueDate) < new Date() ? (
                          <span className="text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3"/> {new Date(s.nextDueDate).toLocaleDateString()}
                          </span>
                        ) : (
                           new Date(s.nextDueDate).toLocaleDateString()
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!supervisions || supervisions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center p-8 text-muted-foreground">No supervision records found.</TableCell>
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
