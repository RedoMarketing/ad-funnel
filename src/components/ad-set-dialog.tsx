"use client";

import * as React from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { CAMPAIGN_STATUSES, type AdSet, type CampaignStatus } from "@/lib/types";
import { dialogKeyDown } from "@/lib/form-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AdSetDialog({
  open,
  onOpenChange,
  campaignId,
  campaignName,
  adSet,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignName: string;
  /** Passing an ad set switches the dialog into edit mode. */
  adSet?: AdSet;
}) {
  const { addAdSet, updateAdSet } = useStore();
  const [name, setName] = React.useState("");
  const [audience, setAudience] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [status, setStatus] = React.useState<CampaignStatus>("active");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(adSet?.name ?? "");
    setAudience(adSet?.audience ?? "");
    setBudget(adSet?.budget ?? "");
    setStatus(adSet?.status ?? "active");
    setSaving(false);
  }, [open, adSet]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const payload = {
        campaignId,
        name: trimmed,
        audience: audience.trim() || undefined,
        budget: budget.trim() || undefined,
        status,
      };
      if (adSet) {
        await updateAdSet(adSet.id, payload);
        toast.success("Ad set updated");
      } else {
        await addAdSet(payload);
        toast.success(`Added to ${campaignName}`);
      }
      onOpenChange(false);
    } catch (e) {
      // Leave the dialog open so the typed values aren't lost.
      toast.error(e instanceof Error ? e.message : "Could not save");
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} onKeyDown={dialogKeyDown}>
          <DialogHeader>
            <DialogTitle>{adSet ? "Edit ad set" : "New ad set"}</DialogTitle>
            <DialogDescription>
              Under <span className="text-foreground font-medium">{campaignName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-5">
            <div className="space-y-2">
              <Label htmlFor="adset-name">Ad set name</Label>
              <Input
                id="adset-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="US Merchants / Broad"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adset-audience">
                Audience <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="adset-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="U.S. Merchants, 1k+ orders/mo"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="adset-budget">
                  Budget <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="adset-budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="$250 / day"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adset-status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as CampaignStatus)}>
                  <SelectTrigger id="adset-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving ? "Saving…" : adSet ? "Save changes" : "Add ad set"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
