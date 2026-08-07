"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  CAMPAIGN_STATUSES,
  FUNNEL_STAGES,
  type Campaign,
  type CampaignStatus,
  type FunnelStage,
} from "@/lib/types";
import { dialogKeyDown } from "@/lib/form-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const NEW_PLATFORM = "__new__";


export function CampaignDialog({
  open,
  onOpenChange,
  productId,
  productName,
  /** Preselects the platform when adding from inside a platform group. */
  defaultPlatformId,
  campaign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  defaultPlatformId?: string;
  campaign?: Campaign;
}) {
  const { data, addCampaign, updateCampaign, addPlatform } = useStore();

  const [name, setName] = React.useState("");
  const [platformId, setPlatformId] = React.useState("");
  const [newPlatformName, setNewPlatformName] = React.useState("");
  const [stage, setStage] = React.useState<FunnelStage>("awareness");
  const [status, setStatus] = React.useState<CampaignStatus>("active");
  const [objective, setObjective] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [landingUrl, setLandingUrl] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(campaign?.name ?? "");
    setPlatformId(campaign?.platformId ?? defaultPlatformId ?? data.platforms[0]?.id ?? "");
    setNewPlatformName("");
    setStage(campaign?.stage ?? "awareness");
    setStatus(campaign?.status ?? "active");
    setObjective(campaign?.objective ?? "");
    setBudget(campaign?.budget ?? "");
    setLandingUrl(campaign?.landingUrl ?? "");
    setNotes(campaign?.notes ?? "");
    setSaving(false);
  }, [open, campaign, defaultPlatformId, data.platforms]);

  const creatingPlatform = platformId === NEW_PLATFORM;
  const canSubmit =
    name.trim().length > 0 &&
    (creatingPlatform ? newPlatformName.trim().length > 0 : platformId.length > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);

    try {
      let resolvedPlatformId = platformId;

      if (creatingPlatform) {
        const trimmed = newPlatformName.trim();
        const existing = data.platforms.find(
          (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
        );
        // createPlatform is idempotent on name, so this is just a round-trip saver.
        resolvedPlatformId = existing ? existing.id : (await addPlatform({ name: trimmed })).id;
      }

      const payload = {
        productId,
        platformId: resolvedPlatformId,
        name: name.trim(),
        stage,
        status,
        objective: objective.trim() || undefined,
        budget: budget.trim() || undefined,
        landingUrl: landingUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (campaign) {
        await updateCampaign(campaign.id, payload);
        toast.success("Campaign updated");
      } else {
        await addCampaign(payload);
        toast.success(`Added to ${productName}`);
      }
      onOpenChange(false);
    } catch (e) {
      // Leave the dialog open so a long form isn't lost on a failed write.
      toast.error(e instanceof Error ? e.message : "Could not save");
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[88vh] overflow-y-auto">
        <form onSubmit={submit} onKeyDown={dialogKeyDown}>
          <DialogHeader>
            <DialogTitle>{campaign ? "Edit campaign" : "New campaign"}</DialogTitle>
            <DialogDescription>
              Under <span className="text-foreground font-medium">{productName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-5">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign name</Label>
              <Input
                id="campaign-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Q3 Prospecting / Broad"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-platform">Ad platform</Label>
              <Select value={platformId} onValueChange={setPlatformId}>
                <SelectTrigger id="campaign-platform" className="w-full">
                  <SelectValue placeholder="Pick a platform" />
                </SelectTrigger>
                <SelectContent>
                  {data.platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_PLATFORM}>
                    <Plus className="size-3.5" />
                    Add a new platform…
                  </SelectItem>
                </SelectContent>
              </Select>
              {creatingPlatform && (
                <Input
                  autoFocus
                  value={newPlatformName}
                  onChange={(e) => setNewPlatformName(e.target.value)}
                  placeholder="Platform name"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="campaign-stage">Funnel stage</Label>
                <Select value={stage} onValueChange={(v) => setStage(v as FunnelStage)}>
                  <SelectTrigger id="campaign-stage" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNNEL_STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                        <span className="text-muted-foreground text-xs">{s.short}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign-status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as CampaignStatus)}>
                  <SelectTrigger id="campaign-status" className="w-full">
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="campaign-objective">
                  Objective <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="campaign-objective"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Leads, Demo, Traffic…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign-budget">
                  Budget <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="campaign-budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="$5k / mo"
                />
              </div>
            </div>


            <div className="space-y-2">
              <Label htmlFor="campaign-url">
                Landing page <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="campaign-url"
                value={landingUrl}
                onChange={(e) => setLandingUrl(e.target.value)}
                placeholder="https://getredo.com/…"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-notes">
                Notes <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="campaign-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Creative angle, offer, anything worth remembering"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!canSubmit || saving}>
              {saving ? "Saving…" : campaign ? "Save changes" : "Add campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
