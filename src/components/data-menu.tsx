"use client";

import * as React from "react";
import { Download, Layers, LogOut, MoreHorizontal, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ManagePlatformsDialog } from "@/components/manage-platforms-dialog";

export function DataMenu() {
  const { exportJson, refresh } = useStore();
  const { email, signOut } = useAuth();
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
        </DropdownMenuContent>
      </DropdownMenu>

      <ManagePlatformsDialog open={platformsOpen} onOpenChange={setPlatformsOpen} />

    </>
  );
}
