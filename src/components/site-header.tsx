"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DataMenu } from "@/components/data-menu";

export function SiteHeader() {
  const { data } = useStore();
  const pathname = usePathname();

  return (
    <header className="bg-background/85 sticky top-0 z-40 border-b backdrop-blur-md md:hidden">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4 sm:px-6">
        <Button
          asChild
          variant={pathname === "/" ? "secondary" : "ghost"}
          size="icon-sm"
          className="shrink-0"
          aria-label="Home"
        >
          <Link href="/">
            <House />
          </Link>
        </Button>

        <Separator orientation="vertical" className="!h-5" />

        <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {data.clouds.map((cloud) => {
            const href = `/cloud/${cloud.slug}`;
            return (
              <Button
                key={cloud.id}
                asChild
                variant={pathname === href ? "secondary" : "ghost"}
                size="sm"
                className="shrink-0 font-normal"
              >
                <Link href={href}>{cloud.name}</Link>
              </Button>
            );
          })}
        </nav>

        <DataMenu />
      </div>
    </header>
  );
}
