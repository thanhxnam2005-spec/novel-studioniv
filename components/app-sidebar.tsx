"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  HomeIcon,
  LibraryIcon,
  PenLineIcon,
  UploadIcon,
  ServerIcon,
  ScrollTextIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export const navConfig = [
  { title: "Home", href: "/", icon: HomeIcon },
  { title: "Library", href: "/library", icon: LibraryIcon },
  { title: "Import", href: "/import", icon: UploadIcon },
  { title: "Providers", href: "/settings/providers", icon: ServerIcon },
  {
    title: "Global Instruction",
    href: "/settings/instructions",
    icon: ScrollTextIcon,
  },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  const mainNav = navConfig.filter(
    (item) => !item.href.startsWith("/settings"),
  );
  const settingsNav = navConfig.filter((item) =>
    item.href.startsWith("/settings"),
  );

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar">
      <SidebarHeader className="px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 overflow-hidden"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent">
            <PenLineIcon className="size-4 text-sidebar-accent-foreground" />
          </div>
          <div className="flex flex-col gap-0 leading-none">
            <span className="font-heading text-[15px] font-semibold tracking-tight text-sidebar-foreground">
              Novel Studio
            </span>
            <span className="text-[11px] text-sidebar-foreground/50">
              Writing workspace
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Access</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Recent novels"
                  className="text-sidebar-foreground/60"
                >
                  <BookOpenIcon />
                  <span className="italic">No recent novels</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
