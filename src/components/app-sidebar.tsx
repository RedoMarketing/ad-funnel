"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, LogOut } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { haptic } from "@/lib/haptics";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { data, ready } = useStore();
  const { email, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-12 justify-center border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="All clouds">
              <Link href="/" onClick={haptic}>
                <House />
                <span className="font-semibold">Ad Funnel</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Clouds</SidebarGroupLabel>
          <SidebarMenu>
            {!ready
              ? [0, 1, 2, 3, 4, 5].map((i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon={false} />
                  </SidebarMenuItem>
                ))
              : data.clouds.map((cloud) => {
                  const href = `/cloud/${cloud.slug}`;
                  const productIds = new Set(
                    data.products.filter((p) => p.cloudId === cloud.id).map((p) => p.id),
                  );
                  const count = data.campaigns.filter((c) => productIds.has(c.productId)).length;

                  return (
                    <SidebarMenuItem key={cloud.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === href}
                        tooltip={cloud.name}
                      >
                        <Link href={href} onClick={haptic}>
                          {/*
                            Stands in for an icon on the collapsed rail only.
                            Without a leading element the label is what gets
                            clipped there, rendering as "B…"; expanded, the
                            full name says it already.
                          */}
                          <span
                            aria-hidden
                            className="hidden size-4 shrink-0 items-center justify-center text-[11px] font-semibold group-data-[collapsible=icon]:flex"
                          >
                            {cloud.name.charAt(0)}
                          </span>
                          <span>{cloud.name}</span>
                        </Link>
                      </SidebarMenuButton>
                      {count > 0 && (
                        <SidebarMenuBadge className="tabular-nums">{count}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => void signOut()} tooltip={email ?? "Sign out"}>
              <LogOut />
              <span className="truncate">{email ?? "Sign out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
