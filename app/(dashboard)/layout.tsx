"use client";

import { AppSidebar, navConfig } from "@/components/app-sidebar";
import { ChatPanel } from "@/components/chat-panel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SparklesIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useChatPanel } from "@/lib/stores/chat-panel";

const pageTitles: Record<string, string> = Object.fromEntries(
  navConfig.map((item) => [item.href, item.title]),
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? "Novel Studio";
  const toggleChat = useChatPanel((s) => s.toggle);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleChat}
              title="Toggle AI Chat (⌘.)"
            >
              <SparklesIcon />
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
      <ChatPanel />
    </SidebarProvider>
  );
}
