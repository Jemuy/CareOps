import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateSafeguardingEvent, useListChildren, useListStaff, getListSafeguardingEventsQueryKey } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ShieldAlert, CheckCircle2, Info } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const EVENT_TYPES = [
  { value: "self_harm", label: "Self Harm" },
  { value: "child_protection", label: "Child Protection" },
  { value: "exploitation", label: "Exploitation (CSE/CCE)" },
  { value: "missing_episode", label: "Missing Episode (Return)" },
  { value: "return_interview", label: "Return Interview" },
  { value: "domestic_abuse", label: "Domestic Abuse" },
  { value: "other", label: "Other Safeguarding Concern" },
];

const RISK_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High — Ofsted notification required" },
  { value: "critical", label: "Critical — Immediate action required" },
];

export function LogSafeguardingModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { data: children } = useListChildren();
  const { data: staff } = useListStaff();
  const { mutate, isPending } = useCreateSafeguardingEvent();

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    childId: "", type: "", date: today, description: "",
    riskLevel: "", reportedBy: "", actionTaken: "",
  });
  const [success, setSuccess] = useState(false);
  const [notificationWarning, setNotificationWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleRiskChange = (v: string) => {
    setForm(f => ({ ...f, riskLevel: v }));
    setNotificationWarning(v === "high" || v === "critical");
  };

  const handleTypeChange = (v: string) => {
    setForm(f => ({ ...f, type: v }));
    if (v === "child_protection" || v === "exploitation") setNotificationWarning(true);
  };

  const handleClose = () => {
    setForm({ childId: "", type: "", date: today, description: "", riskLevel: "", reportedBy: "", actionTaken: "" });
    setSuccess(false);
    setNotificationWarning(false);
    setError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.childId || !form.type || !form.date || !form.description || !form.riskLevel || !form.reportedBy) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);
    mutate(
      {
        data: {
          childId: parseInt(form.childId),
          type: form.type as any,
          date: form.date,
          description: form.description,
          riskLevel: form.riskLevel as any,
          reportedBy: form.reportedBy,
          actionTaken: form.actionTaken || undefined,
        } as any
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListSafeguardingEventsQueryKey() });
          setSuccess(true);
          setTimeout(handleClose, 1400);
        },
        onError: () => setError("Failed to record safeguarding event. Please try again."),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            Record Safeguarding Event
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-10 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <p className="text-lg font-semibold text-slate-800">Safeguarding event recorded</p>
            <p className="text-sm text-slate-500">The event has been logged and will appear in the safeguarding register.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Young person <span className="text-destructive">*</span></Label>
                <Select value={form.childId} onValueChange={v => setForm(f => ({ ...f, childId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select young person" /></SelectTrigger>
                  <SelectContent>
                    {children?.filter(c => c.status === "current").map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.date} onChange={set("date")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Event type <span className="text-destructive">*</span></Label>
                <Select value={form.type} onValueChange={handleTypeChange}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Risk level <span className="text-destructive">*</span></Label>
                <Select value={form.riskLevel} onValueChange={handleRiskChange}>
                  <SelectTrigger><SelectValue placeholder="Select risk level" /></SelectTrigger>
                  <SelectContent>
                    {RISK_LEVELS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {notificationWarning && (
              <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-sm px-3 py-2.5 rounded-lg">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>This event <strong>requires Ofsted notification</strong>. This will be flagged automatically on save.</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Description <span className="text-destructive">*</span></Label>
              <Textarea value={form.description} onChange={set("description")} rows={3}
                placeholder="What happened? Include time, context, and any immediate safeguarding concerns." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Reported by <span className="text-destructive">*</span></Label>
                <Select value={form.reportedBy} onValueChange={v => setForm(f => ({ ...f, reportedBy: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                  <SelectContent>
                    {staff?.filter(s => s.status === "active").map(s => (
                      <SelectItem key={s.id} value={`${s.firstName} ${s.lastName}`}>
                        {s.firstName} {s.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Immediate action taken</Label>
                <Input value={form.actionTaken} onChange={set("actionTaken")} placeholder="e.g. First aid, parents notified…" />
              </div>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground">
                {isPending ? "Recording…" : "Record Event"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
