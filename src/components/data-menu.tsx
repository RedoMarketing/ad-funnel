"use client";

import * as React from "react";
import { Download, MoreHorizontal, RotateCcw, Upload, Layers } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ManagePlatformsDialog } from "@/components/manage-platforms-dialog";

export function DataMenu() {
  const { exportJson, importJson, resetAll } = useStore();
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [platformsOpen, setPlatformsOpen] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function handleExport() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ad-funnel-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported");
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      importJson(await file.text());
      toast.success("Imported");
    } catch {
      toast.error("That file could not be read as funnel data");
    }
    e.target.value = "";
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0" aria-label="Data options">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => setPlatformsOpen(true)}>
            <Layers className="size-4" />
            Manage platforms
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleExport}>
            <Download className="size-4" />
            Export JSON
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
            <Upload className="size-4" />
            Import JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmReset(true)}>
            <RotateCcw className="size-4" />
            Reset all data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImport}
      />

      <ManagePlatformsDialog open={platformsOpen} onOpenChange={setPlatformsOpen} />

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset everything?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears every product, platform, and campaign you have added and restores the
              starting clouds. Export first if you want a copy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetAll();
                toast.success("Reset to a clean slate");
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
