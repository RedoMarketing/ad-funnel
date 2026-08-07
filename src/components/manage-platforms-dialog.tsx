"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ManagePlatformsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, addPlatform, removePlatform } = useStore();
  const [name, setName] = React.useState("");

  const [saving, setSaving] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    if (data.platforms.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`${trimmed} already exists`);
      return;
    }
    setSaving(true);
    try {
      await addPlatform({ name: trimmed });
      setName("");
      toast.success(`Added ${trimmed}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add platform");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ad platforms</DialogTitle>
          <DialogDescription>
            Platforms are shared across every cloud and product.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="-mx-1 h-64 px-1">
          <div className="space-y-1">
            {data.platforms.map((platform) => {
              const inUse = data.campaigns.filter((c) => c.platformId === platform.id).length;
              return (
                <div
                  key={platform.id}
                  className="group hover:bg-muted/60 flex items-center gap-2.5 rounded-md px-2 py-1.5"
                >
                  <span className="flex-1 truncate text-sm">{platform.name}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {inUse > 0 ? `${inUse} campaign${inUse === 1 ? "" : "s"}` : "unused"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 row-action"
                    aria-label={`Remove ${platform.name}`}
                    onClick={async () => {
                      try {
                        await removePlatform(platform.id);
                        toast.success(
                          inUse > 0
                            ? `Removed ${platform.name} and its ${inUse} campaign${inUse === 1 ? "" : "s"}`
                            : `Removed ${platform.name}`,
                        );
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Could not remove platform");
                      }
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <form onSubmit={submit} className="space-y-2 border-t pt-4">
          <Label htmlFor="platform-name">New platform</Label>
          <div className="flex gap-2">
            <Input
              id="platform-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pinterest, Snapchat, Taboola…"
            />
            <Button type="submit" disabled={!name.trim() || saving}>
              <Plus />
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
