"use client";

import { AppSidebar, miscNav, navConfig } from "@/components/app-sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { DictInitializer } from "@/components/dict-initializer";
import { GlobalSearchDialog } from "@/components/global-search-dialog";
import { NameDictPanel } from "@/components/name-dict/name-dict-panel";
import { ReaderPanel } from "@/components/reader/reader-panel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { WelcomeModal } from "@/components/welcome-modal";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useChatPanel } from "@/lib/stores/chat-panel";
import { useGlobalSearch } from "@/lib/stores/global-search";
import { useNameDictPanel } from "@/lib/stores/name-dict-panel";
import { useReaderPanel } from "@/lib/stores/reader-panel";
import {
  BookTextIcon,
  BotIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
  Volume2Icon,
} from "lucide-react";
import { PageContextSync } from "@/components/chat/page-context-sync";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ScraperOverlay } from "@/components/scraper/scraper-overlay";

const pageTitles: Record<string, string> = Object.fromEntries(
  [...navConfig, ...miscNav].map((item) => [item.href, item.title]),
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  let pageTitle = pageTitles[pathname] ?? "Novel Studio";
  if (pathname.match(/^\/novels\/[^/]+$/)) pageTitle = "Tiểu thuyết";
  if (pathname.match(/^\/novels\/[^/]+\/read(\/\d+)?$/))
    pageTitle = "Đọc truyện";
  if (pathname.match(/^\/novels\/[^/]+\/chapters\/.+$/))
    pageTitle = "Soạn thảo";
  const novelIdMatch = pathname.match(/^\/novels\/([^/]+)/);
  const currentNovelId = novelIdMatch?.[1] ?? null;
  const chapterIdMatch = pathname.match(/^\/novels\/[^/]+\/chapters\/([^/]+)/);
  const currentChapterId = chapterIdMatch?.[1] ?? null;
  const readerOrderMatch = pathname.match(/^\/novels\/[^/]+\/read\/(\d+)/);
  const currentReaderOrder = readerOrderMatch
    ? parseInt(readerOrderMatch[1], 10)
    : null;
  const toggleChat = useChatPanel((s) => s.toggle);
  const isReaderOpen = useReaderPanel((s) => s.isOpen);
  const isReaderPlaying = useReaderPanel((s) => s.isPlaying);
  const toggleReader = useReaderPanel((s) => s.toggle);
  const toggleSearch = useGlobalSearch((s) => s.toggle);
  const nameDictToggle = useNameDictPanel((s) => s.toggle);
  const nameDictSetNovelId = useNameDictPanel((s) => s.setNovelId);
  const toggleNameDict = () => nameDictToggle(currentNovelId);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Keep name dict panel's novelId in sync with URL
  useEffect(() => {
    nameDictSetNovelId(currentNovelId);
  }, [currentNovelId, nameDictSetNovelId]);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase!.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        console.log('Initial session:', session?.user?.email || 'No session');
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Exception getting session:', err);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email || 'No user');
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const handleRefreshAuth = async () => {
    if (!supabase) return;
    setAuthLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Refresh auth error:', error);
      }
      console.log('Refreshed session:', session?.user?.email || 'No session');
      setUser(session?.user ?? null);
    } catch (err) {
      console.error('Refresh auth exception:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  // Global search shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSearch();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSearch]);

  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(isDark);
  }, []);
  const toggleDark = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="mesh-bg">
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur-md px-3 sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {authLoading ? (
            <div className="ml-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Đang tải...</span>
            </div>
          ) : user ? (
            <div className="ml-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Đã đăng nhập:</span>
              <span>{user.user_metadata?.full_name || user.email || user.id}</span>
              <button
                onClick={handleRefreshAuth}
                className="ml-1 text-xs text-muted-foreground hover:text-foreground underline"
                disabled={authLoading}
              >
                Làm mới
              </button>
              <button
                onClick={handleLogout}
                className="ml-1 text-xs text-muted-foreground hover:text-foreground underline"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="ml-3">
              <Link href="/auth">
                <button className="inline-flex h-7 items-center rounded-lg bg-secondary px-3 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/90">
                  Đăng nhập
                </button>
              </Link>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleReader}
              className={
                isReaderPlaying
                  ? !isReaderOpen
                    ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 animate-pulse"
                    : "bg-muted"
                  : undefined
              }
              title="Đọc truyện (TTS)"
            >
              <Volume2Icon className="mr-0.5" />
              Đọc truyện
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSearch}
              title="Tìm kiếm (⌘K)"
            >
              <SearchIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleDark}
              title="Chế độ sáng/tối"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleNameDict}
              title="Từ điển tên"
            >
              <BookTextIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleChat}
              title="Bật/tắt AI Chat (⌘.)"
            >
              <BotIcon />
            </Button>
          </div>
        </header>
        <div className="min-w-0 flex-1 overflow-auto">{children}</div>
      </SidebarInset>
      <PageContextSync
        novelId={currentNovelId}
        pathnameChapterId={currentChapterId}
        readerChapterOrder={currentReaderOrder}
      />
      <ReaderPanel />
      <ChatPanel />
      <NameDictPanel />
      <DictInitializer />
      <GlobalSearchDialog />
      <WelcomeModal />
      <ScraperOverlay />
    </SidebarProvider>
  );
}
