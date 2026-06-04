import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateStaffMember, getListStaffQueryKey } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const ROLES = [
  "Registered Manager", "Deputy Manager", "Senior Support Worker",
  "Support Worker", "Night Support Worker", "Bank Support Worker",
];

export function AddStaffModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { mutate, isPending } = useCreateStaffMember();

  const [form, setForm] = useState({
    firstName: "", lastName: "", role: "", startDate: "",
    dbsExpiryDate: "", qualifications: "", rightToWork: false,
  });
  const [success, setSuccess] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleClose = () => {
    setForm({ firstName: "", lastName: "", role: "", startDate: "", dbsExpiryDate: "", qualifications: "", rightToWork: false });
    setSuccess(false);
    setSuccessName("");
    setError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.role || !form.startDate || !form.dbsExpiryDate) {
      setError("Please fill in all required fields.");
      return;
    }
    setError(null);
    const name = `${form.firstName} ${form.lastName}`;
    mutate(
      { data: { ...form, status: "active", mandatoryTrainingComplete: false } as any },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListStaffQueryKey() });
          setSuccessName(name);
          setSuccess(true);
          setTimeout(handleClose, 1400);
        },
        onError: () => setError("Failed to add staff member. Please try again."),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="w-5 h-5 text-primary" />
            Add Staff Member
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-10 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <p className="text-lg font-semibold text-slate-800">Staff member added</p>
            <p className="text-sm text-slate-500">{successName} has been added to the workforce register.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First name <span className="text-destructive">*</span></Label>
                <Input value={form.firstName} onChange={set("firstName")} placeholder="e.g. Jordan" />
              </div>
              <div className="space-y-1.5">
                <Label>Last name <span className="text-destructive">*</span></Label>
                <Input value={form.lastName} onChange={set("lastName")} placeholder="e.g. Clarke" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Role <span className="text-destructive">*</span></Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start date <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.startDate} onChange={set("startDate")} />
              </div>
              <div className="space-y-1.5">
                <Label>DBS expiry date <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.dbsExpiryDate} onChange={set("dbsExpiryDate")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Qualifications</Label>
              <Textarea value={form.qualifications} onChange={set("qualifications")} rows={2}
                placeholder="e.g. Level 3 Diploma in Residential Childcare" />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="rtw"
                checked={form.rightToWork}
                onCheckedChange={c => setForm(f => ({ ...f, rightToWork: c === true }))}
              />
              <Label htmlFor="rtw" className="font-normal cursor-pointer">Right to work verified</Label>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground">
                {isPending ? "Adding…" : "Add Staff Member"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
