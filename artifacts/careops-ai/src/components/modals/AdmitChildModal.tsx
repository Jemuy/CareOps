import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateChild, useListStaff, getListChildrenQueryKey } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;

export function AdmitChildModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { data: staff } = useListStaff();
  const { mutate, isPending } = useCreateChild();

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    firstName: "", lastName: "", dateOfBirth: "", admissionDate: today,
    keyWorker: "", placingAuthority: "", localAuthority: "", riskLevel: "low", notes: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleClose = () => {
    setForm({ firstName: "", lastName: "", dateOfBirth: "", admissionDate: today, keyWorker: "", placingAuthority: "", localAuthority: "", riskLevel: "low", notes: "" });
    setSuccess(false);
    setError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.dateOfBirth || !form.admissionDate || !form.keyWorker) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);
    mutate(
      { data: { ...form, status: "current" } as any },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListChildrenQueryKey() });
          setSuccess(true);
          setTimeout(handleClose, 1400);
        },
        onError: () => setError("Failed to admit young person. Please try again."),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="w-5 h-5 text-primary" />
            Admit Young Person
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-10 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <p className="text-lg font-semibold text-slate-800">Young person admitted</p>
            <p className="text-sm text-slate-500">{form.firstName} {form.lastName} has been added to the register.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name <span className="text-destructive">*</span></Label>
                <Input id="firstName" value={form.firstName} onChange={set("firstName")} placeholder="e.g. Jamie" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name <span className="text-destructive">*</span></Label>
                <Input id="lastName" value={form.lastName} onChange={set("lastName")} placeholder="e.g. Williams" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dob">Date of birth <span className="text-destructive">*</span></Label>
                <Input id="dob" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admission">Admission date <span className="text-destructive">*</span></Label>
                <Input id="admission" type="date" value={form.admissionDate} onChange={set("admissionDate")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Key worker <span className="text-destructive">*</span></Label>
                <Select value={form.keyWorker} onValueChange={v => setForm(f => ({ ...f, keyWorker: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select key worker" /></SelectTrigger>
                  <SelectContent>
                    {staff?.filter(s => s.status === "active").map(s => (
                      <SelectItem key={s.id} value={`${s.firstName} ${s.lastName}`}>
                        {s.firstName} {s.lastName} — {s.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Initial risk level</Label>
                <Select value={form.riskLevel} onValueChange={v => setForm(f => ({ ...f, riskLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RISK_LEVELS.map(l => <SelectItem key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pa">Placing authority</Label>
                <Input id="pa" value={form.placingAuthority} onChange={set("placingAuthority")} placeholder="e.g. Birmingham City Council" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="la">Local authority</Label>
                <Input id="la" value={form.localAuthority} onChange={set("localAuthority")} placeholder="e.g. Birmingham" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Initial notes</Label>
              <Textarea id="notes" value={form.notes} onChange={set("notes")} rows={2} placeholder="Background, current concerns, placement context…" />
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground">
                {isPending ? "Admitting…" : "Admit Young Person"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
