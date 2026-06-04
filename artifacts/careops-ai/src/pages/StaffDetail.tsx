import React from "react";
import { useParams, Link } from "wouter";
import { useGetStaffMember } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit, ShieldAlert, GraduationCap, Briefcase, FileText } from "lucide-react";
import { StaffMemberDbsStatus, StaffMemberStatus } from "@workspace/api-client-react";

export function StaffDetail() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0", 10);

  const { data: staff, isLoading } = useGetStaffMember(id, { query: { enabled: !!id, queryKey: ['getStaffMember', id] } });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-12 w-64" /><Skeleton className="h-[400px]" /></div>;
  }

  if (!staff) return <div>Staff member not found.</div>;

  const getDbsBadge = (status: StaffMemberDbsStatus) => {
    switch (status) {
      case 'valid': return <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">Valid</Badge>;
      case 'expiring_soon': return <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">Expiring Soon</Badge>;
      case 'expired': return <Badge variant="destructive">Expired</Badge>;
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusBadge = (status?: StaffMemberStatus) => {
    switch (status) {
      case 'active': return <Badge className="bg-primary">Active</Badge>;
      case 'on_leave': return <Badge variant="outline" className="border-amber-500 text-amber-700">On Leave</Badge>;
      case 'left': return <Badge variant="secondary">Left</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" asChild className="text-slate-500">
          <Link href="/workforce"><ChevronLeft className="w-4 h-4 mr-1"/> Back to Workforce</Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-2xl border border-slate-300">
            {staff.firstName[0]}{staff.lastName[0]}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{staff.firstName} {staff.lastName}</h1>
            <div className="flex items-center gap-3 mt-1">
              {getStatusBadge(staff.status)}
              <span className="text-muted-foreground text-sm font-medium">{staff.role}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Compliance</div>
            <div className="text-xl font-bold text-slate-800">{staff.complianceScore}%</div>
          </div>
          <Button variant="outline"><Edit className="w-4 h-4 mr-2" /> Edit Profile</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           {/* Details will be expanded when mockups allow, or using simple layout */}
           <Card>
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2"><Briefcase className="w-5 h-5 text-slate-500"/> Employment Details</CardTitle>
             </CardHeader>
             <CardContent className="grid grid-cols-2 gap-6 text-sm">
               <div>
                 <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Start Date</span>
                 <span className="text-slate-800 font-medium">{new Date(staff.startDate).toLocaleDateString()}</span>
               </div>
               <div>
                 <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Right to Work</span>
                 {staff.rightToWork ? <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">Verified</Badge> : <Badge variant="destructive">Unverified</Badge>}
               </div>
               <div className="col-span-2">
                 <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Qualifications</span>
                 <span className="text-slate-800">{staff.qualifications || 'No specific qualifications recorded.'}</span>
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="w-5 h-5 text-blue-500"/> Training & Supervisions</CardTitle>
             </CardHeader>
             <CardContent className="grid grid-cols-2 gap-6 text-sm">
               <div>
                 <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Mandatory Training</span>
                 {staff.mandatoryTrainingComplete ? <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50">Complete</Badge> : <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">Incomplete</Badge>}
               </div>
               <div>
                 <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Last Supervision</span>
                 <span className="text-slate-800">{staff.lastSupervisionDate ? new Date(staff.lastSupervisionDate).toLocaleDateString() : 'None recorded'}</span>
               </div>
               <div>
                 <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Last Appraisal</span>
                 <span className="text-slate-800">{staff.lastAppraisalDate ? new Date(staff.lastAppraisalDate).toLocaleDateString() : 'None recorded'}</span>
               </div>
             </CardContent>
           </Card>
        </div>

        <div>
          <Card className={staff.dbsStatus === 'expired' ? 'border-destructive' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-slate-500"/> DBS Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-2">Current Status</span>
                {getDbsBadge(staff.dbsStatus)}
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Expiry Date</span>
                <span className="text-sm font-medium text-slate-800">{new Date(staff.dbsExpiryDate).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
