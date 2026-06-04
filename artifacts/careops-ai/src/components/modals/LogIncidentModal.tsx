import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateIncident, useListChildren, useListStaff, getListIncidentsQueryKey } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const INCIDENT_TYPES = [
  { value: "self_harm", label: "Self Harm" },
  { value: "physical_altercation", label: "Physical Altercation" },
  { value: "substance_misuse", label: "Substance Misuse" },
  { value: "absconding", label: "Absconding" },
  { value: "property_damage", label: "Property Damage" },
  { value: "verbal_aggression", label: "Verbal Aggression" },
  { value: "other", label: "Other" },
];

const SEVERITIES = [
  { value: "minor", label: "Minor" },
  { value: "moderate", label: "Moderate" },
  { value: "serious", label: "Serious — Ofsted notification likely required" },
  { value: "critical", label: "Critical — Ofsted notification required" },
];

export function LogIncidentModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { data: children } = useListChildren();
  const { data: staff } = useListStaff();
  const { mutate, isPending } = useCreateIncident();

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    title: "", date: today, type: "", severity: "",
    childId: "", description: "", recordedBy: "", followUpActions: "",
  });
  const [success, setSuccess] = useState(false);
  const [notificationWarning, setNotificationWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSeverityChange = (v: string) => {
    setForm(f => ({ ...f, severity: v }));
    setNotificationWarning(v === "serious" || v === "critical");
  };

  const handleTypeChange = (v: string) => {
    setForm(f => ({ ...f, type: v }));
    if (v === "self_harm" || v === "absconding") setNotificationWarning(true);
  };

  const handleClose = () => {
    setForm({ title: "", date: today, type: "", severity: "", childId: "", description: "", recordedBy: "", followUpActions: "" });
    setSuccess(false);
    setNotificationWarning(false);
    setError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.type || !form.severity || !form.description || !form.recordedBy) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);
    mutate(
      {
        data: {
          title: form.title, date: form.date, type: form.type, severity: form.severity as any,
          childId: form.childId ? parseInt(form.childId) : undefined,
          description: form.description, recordedBy: form.recordedBy,
          followUpActions: form.followUpActions || undefined,
        } as any
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListIncidentsQueryKey() });
          setSuccess(true);
          setTimeout(handleClose, 1400);
        },
        onError: () => setError("Failed to log incident. Please try again."),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Log Incident
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-10 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <p className="text-lg font-semibold text-slate-800">Incident logged</p>
            <p className="text-sm text-slate-500">The incident has been recorded and will appear in the log.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={set("title")} placeholder="Brief description of incident" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type <span className="text-destructive">*</span></Label>
                <Select value={form.type} onValueChange={handleTypeChange}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Severity <span className="text-destructive">*</span></Label>
                <Select value={form.severity} onValueChange={handleSeverityChange}>
                  <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {notificationWarning && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2.5 rounded-lg">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>This incident will require an <strong>Ofsted notification</strong>. Suggested wording will be auto-generated on save.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.date} onChange={set("date")} />
              </div>
              <div className="space-y-1.5">
                <Label>Young person involved</Label>
                <Select value={form.childId} onValueChange={v => setForm(f => ({ ...f, childId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select (optional)" /></SelectTrigger>
                  <SelectContent>
                    {children?.filter(c => c.status === "current").map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.firstName} {c.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description <span className="text-destructive">*</span></Label>
              <Textarea value={form.description} onChange={set("description")} rows={3}
                placeholder="What happened? Include time, location, who was present, and immediate response." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Recorded by <span className="text-destructive">*</span></Label>
                <Select value={form.recordedBy} onValueChange={v => setForm(f => ({ ...f, recordedBy: v }))}>
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
                <Label>Follow-up actions</Label>
                <Input value={form.followUpActions} onChange={set("followUpActions")} placeholder="Immediate actions taken…" />
              </div>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground">
                {isPending ? "Logging…" : "Log Incident"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
