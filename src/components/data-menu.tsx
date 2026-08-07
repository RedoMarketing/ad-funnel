"use client";

import * as React from "react";
import { Download, Layers, LogOut, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { clearFunnelData } from "@/lib/db";
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
  const { exportJson, refresh, data } = useStore();
  const { email, signOut } = useAuth();
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [platformsOpen, setPlatformsOpen] = React.useState(false);

  function handleExport() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ad-funnel-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported a snapshot");
  }

  const productCount = data.products.length;
  const campaignCount = data.campaigns.length;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="shrink-0" aria-label="Data options">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={() => setPlatformsOpen(true)}>
            <Layers />
            Manage platforms
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={async () => {
              await refresh();
              toast.success("Reloaded from Supabase");
            }}
          >
            <RefreshCw />
            Reload
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleExport}>
            <Download />
            Export snapshot
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {email && (
            <div className="text-muted-foreground truncate px-2 py-1.5 text-xs">{email}</div>
          )}
          <DropdownMenuItem onSelect={() => void signOut()}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmClear(true)}>
            <Trash2 />
            Delete all products
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ManagePlatformsDialog open={platformsOpen} onOpenChange={setPlatformsOpen} />

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {productCount} product{productCount === 1 ? "" : "s"} and {campaignCount}{" "}
              campaign{campaignCount === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This deletes them from Supabase for everyone, not just this browser, and cannot be
              undone. Your platform list stays. Export a snapshot first if you want a copy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await clearFunnelData();
                  await refresh();
                  toast.success("Deleted");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not delete");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
