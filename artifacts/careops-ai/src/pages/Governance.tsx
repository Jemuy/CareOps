import React from "react";
import { useListComplaints, useListNotifications, useListPolicies, useGetGovernanceSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, MessageSquare, BellRing, FileText, CheckCircle, AlertTriangle } from "lucide-react";

export function Governance() {
  const { data: summary, isLoading: loadingSummary } = useGetGovernanceSummary();
  const { data: complaints, isLoading: loadingComplaints } = useListComplaints();
  const { data: notifications, isLoading: loadingNotifications } = useListNotifications();
  const { data: policies, isLoading: loadingPolicies } = useListPolicies();

  if (loadingSummary || loadingComplaints || loadingNotifications || loadingPolicies) {
    return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-32" /><Skeleton className="h-[400px]" /></div>;
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'open': return <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">Open</Badge>;
      case 'resolved': return <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">Resolved</Badge>;
      case 'investigating':
      case 'under_investigation': return <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">Under Investigation</Badge>;
      case 'current': return <Badge className="bg-emerald-500">Current</Badge>;
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
      case 'due_for_review': return <Badge className="bg-amber-500 hover:bg-amber-600">Due for Review</Badge>;
      case 'needs_review': return <Badge className="bg-amber-500">Needs Review</Badge>;
      case 'expired': return <Badge variant="destructive">Expired</Badge>;
      default: return <Badge variant="secondary" className="capitalize">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Governance</h1>
        <p className="text-muted-foreground mt-1">Oversight of complaints, Ofsted notifications, and policy reviews.</p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-50 border-slate-200">
             <CardContent className="p-4 flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Open Complaints</p>
                 <h3 className="text-3xl font-bold text-slate-800">{summary.openComplaints}</h3>
               </div>
               <div className="p-3 rounded-full bg-rose-100 text-rose-600">
                 <MessageSquare size={24} />
               </div>
             </CardContent>
           </Card>
           <Card className="bg-slate-50 border-slate-200">
             <CardContent className="p-4 flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Pending Notifications</p>
                 <h3 className="text-3xl font-bold text-slate-800">{summary.pendingNotifications}</h3>
               </div>
               <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                 <BellRing size={24} />
               </div>
             </CardContent>
           </Card>
           <Card className="bg-slate-50 border-slate-200">
             <CardContent className="p-4 flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Policies to Review</p>
                 <h3 className="text-3xl font-bold text-slate-800">{summary.policiesOverdue ?? 0}</h3>
               </div>
               <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                 <FileText size={24} />
               </div>
             </CardContent>
           </Card>
        </div>
      )}

      <Tabs defaultValue="complaints" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="complaints">Complaints & Compliments</TabsTrigger>
          <TabsTrigger value="notifications">Ofsted Notifications</TabsTrigger>
          <TabsTrigger value="policies">Policies Register</TabsTrigger>
        </TabsList>
        
        <TabsContent value="complaints">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-[300px]">Description</TableHead>
                    <TableHead>Raised By</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints?.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm whitespace-nowrap">{new Date(c.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                         <Badge variant={c.type === 'complaint' ? 'destructive' : 'secondary'} className="capitalize">
                           {c.type}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="line-clamp-2">{c.description}</div>
                      </TableCell>
                      <TableCell className="text-sm">{c.raisedBy}</TableCell>
                      <TableCell>{getStatusBadge(c.status)}</TableCell>
                    </TableRow>
                  ))}
                  {(!complaints || complaints.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center p-8 text-slate-500">No complaints or compliments found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
           <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-[250px]">Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications?.map(n => (
                    <TableRow key={n.id}>
                      <TableCell className="text-sm whitespace-nowrap">{new Date(n.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                         <Badge variant="outline" className="capitalize text-[10px] bg-slate-50">
                           {n.type.replace(/_/g, ' ')}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="line-clamp-2">{n.description}</div>
                      </TableCell>
                      <TableCell>
                        {n.sent ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle className="w-3 h-3"/> Sent</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-600"><AlertTriangle className="w-3 h-3"/> Pending</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{n.reference || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {(!notifications || notifications.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center p-8 text-slate-500">No notifications found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
           <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Policy Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Next Review</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies?.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-slate-800">{p.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-[10px]">{p.category.replace(/_/g, ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">v{p.version}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {p.nextReviewDate ? new Date(p.nextReviewDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                    </TableRow>
                  ))}
                  {(!policies || policies.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center p-8 text-slate-500">No policies found.</TableCell>
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
