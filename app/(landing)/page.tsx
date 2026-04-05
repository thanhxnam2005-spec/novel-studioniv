import {
  BookOpenIcon,
  BotIcon,
  CpuIcon,
  GlobeIcon,
  LibraryIcon,
  MicIcon,
  PenLineIcon,
  ScanSearchIcon,
  SparklesIcon,
  Volume2Icon,
} from "lucide-react";
import Link from "next/link";
import { LandingThemeToggle } from "./landing-theme-toggle";

const FEATURES = [
  {
    icon: LibraryIcon,
    title: "Local-first, dữ liệu trên máy bạn",
    body: "Tiểu thuyết, chương và nhân vật lưu trong trình duyệt. Không bắt buộc đăng nhập. Có sao lưu / khôi phục và tùy chọn đồng bộ giữa thiết bị.",
  },
  {
    icon: BotIcon,
    title: "AI đa nhà cung cấp & chat theo ngữ cảnh",
    body: "OpenAI, Anthropic, Google, Groq, Mistral, xAI hay API tương thích. Chat hiểu truyện đang mở, tra cứu nội dung, đính kèm file — có thể chỉnh dữ liệu qua công cụ.",
  },
  {
    icon: SparklesIcon,
    title: "Phân tích & Auto-Write",
    body: "Pipeline phân tích chương → tổng hợp → nhân vật. Auto-Write: wizard dựng khung, viết từng chương theo bước, viết lại có diff, chế độ thông minh và hands-free.",
  },
  {
    icon: PenLineIcon,
    title: "Convert Trung → Việt & biên tập",
    body: "Quick Translator với từ điển QT, từ điển tên, Live khi gõ, nhận diện tên. Tìm & thay thế nâng cao (regex, rule, hàng loạt) kèm diff.",
  },
  {
    icon: MicIcon,
    title: "Đọc truyện bằng giọng nói",
    body: "Nhiều nhà cung cấp TTS, tùy tốc độ và ngữ cảnh. Điều khiển từ thanh thông báo hệ điều hành, làm nổi bật câu đang đọc.",
  },
  {
    icon: ScanSearchIcon,
    title: "Scraper & thư viện",
    body: "Nhập chương từ URL, có extension hỗ trợ. Thư viện có tìm kiếm, lọc, lưới/danh sách. Tìm toàn cục ⌘K xuyên suốt ứng dụng.",
  },
  {
    icon: CpuIcon,
    title: "WebGPU tại chỗ",
    body: "Chạy model nhỏ ngay trên GPU trình duyệt — không cần API key cho luồng trò chuyện cục bộ.",
  },
  {
    icon: GlobeIcon,
    title: "Giao diện tiếng Việt",
    body: "Toàn bộ nút, thông báo và hướng dẫn bằng tiếng Việt, phông tối ưu hiển thị.",
  },
] as const;

export default function LandingPage() {
  return (
    <>
      <a
        href="#noi-dung-chinh"
        className="sr-only focus:not-sr-only focus:bg-card focus:text-card-foreground focus:border-border focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:border focus:px-3 focus:py-2"
      >
        Bỏ qua đến nội dung
      </a>

      <header className="landing-in landing-in-delay-1 bg-background/80 sticky top-0 z-20 border-b border-border backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <span className="text-foreground text-xl font-semibold tracking-wide">
            Novel Studio
          </span>
          <div className="flex items-center gap-1 sm:gap-2">
            <LandingThemeToggle />
            <nav className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/changelog"
                className="landing-ghost rounded-full px-3 py-1.5 text-xs font-medium sm:text-sm"
              >
                Nhật ký
              </Link>
              <Link
                href="/dashboard"
                className="landing-cta rounded-full px-4 py-1.5 text-xs font-semibold sm:text-sm"
              >
                Vào ứng dụng
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main id="noi-dung-chinh">
        <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pt-24 md:pb-28 md:pt-32">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.15fr_minmax(0,1fr)] lg:items-end lg:gap-16">
            <div>
              <p className="landing-in landing-in-delay-2 text-chart-1 mb-4 text-sm font-medium tracking-[0.2em] uppercase">
                Sáng tác · Đọc · Phân tích
              </p>
              <h1 className="landing-in landing-in-delay-3 text-foreground text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-[3.35rem]">
                Không gian tiểu thuyết{" "}
                <span className="text-chart-1 italic">nằm gọn</span> trong
                trình duyệt của bạn.
              </h1>
              <p className="landing-in landing-in-delay-4 text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed">
                Một bàn làm việc cho người viết: soạn thảo, AI đồng hành, convert
                Trung–Việt, đọc bằng giọng nói và phân tích tác phẩm — dữ liệu
                ưu tiên lưu cục bộ, kết nối mạng chỉ khi bạn cấu hình AI.
              </p>
              <div className="landing-in landing-in-delay-5 mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard"
                  className="landing-cta inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
                >
                  Bắt đầu ngay
                </Link>
                <a
                  href="#tinh-nang"
                  className="landing-ghost inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium"
                >
                  Xem tính năng
                </a>
              </div>
            </div>

            <div className="landing-in landing-in-delay-4 relative hidden lg:block">
              <div
                aria-hidden
                className="landing-hero-line from-chart-1 absolute -right-4 top-0 h-32 w-px bg-gradient-to-b to-transparent"
              />
              <div className="bg-card border-border rounded-2xl border p-8 shadow-2xl">
                <div className="flex items-start gap-4">
                  <div className="bg-chart-1/15 ring-border flex size-11 shrink-0 items-center justify-center rounded-xl ring-1">
                    <BookOpenIcon
                      className="text-chart-1 size-5"
                      strokeWidth={1.75}
                    />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      Trích dẫn
                    </p>
                    <p className="text-foreground mt-3 text-base leading-relaxed italic">
                      “Chúng tôi không viết thay bạn — chúng tôi dọn bàn, thắp
                      đèn và giữ cho mạch chữ không bị đứt.”
                    </p>
                    <p className="text-muted-foreground mt-4 text-xs">
                      — Novel Studio
                    </p>
                  </div>
                </div>
                <div className="border-border mt-8 grid grid-cols-3 gap-3 border-t pt-8">
                  {[
                    { k: "AI", v: "Đa nhà cung cấp" },
                    { k: "Dữ liệu", v: "Trên thiết bị" },
                    { k: "UI", v: "Tiếng Việt" },
                  ].map((item) => (
                    <div key={item.k}>
                      <p className="text-chart-2 text-[10px] font-semibold tracking-widest uppercase">
                        {item.k}
                      </p>
                      <p className="text-foreground mt-1 text-sm">{item.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="landing-in-fade mx-auto mt-16 grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-4 md:mt-24">
            {[
              { Icon: BotIcon, label: "Chat & công cụ" },
              { Icon: Volume2Icon, label: "TTS đa nguồn" },
              { Icon: PenLineIcon, label: "Auto-Write" },
              { Icon: LibraryIcon, label: "Thư viện & ⌘K" },
            ].map(({ Icon, label }) => (
              <div
                key={label}
                className="bg-muted/60 border-border flex items-center gap-3 rounded-xl border px-4 py-3"
              >
                <Icon
                  className="text-chart-1 size-4 shrink-0"
                  strokeWidth={1.75}
                />
                <span className="text-muted-foreground text-sm">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section
          id="tinh-nang"
          className="border-border border-t px-5 py-20 sm:px-8 md:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
              Những trụ cột lớn
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Gom nhiều công cụ vào một luồng làm việc — từ nhập liệu, biên tập,
              đến trải nghiệm đọc và phân tích bằng AI.
            </p>

            <ul className="mt-14 grid list-none gap-4 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li
                  key={f.title}
                  className="landing-card bg-card border-border rounded-2xl border p-6"
                >
                  <div className="flex items-start gap-4">
                    <span className="bg-chart-1/15 ring-border flex size-10 shrink-0 items-center justify-center rounded-xl ring-1">
                      <f.icon
                        className="text-chart-1 size-[1.125rem]"
                        strokeWidth={1.75}
                      />
                    </span>
                    <div>
                      <h3 className="text-foreground text-lg font-semibold">
                        {f.title}
                      </h3>
                      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                        {f.body}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="bg-muted border-border relative overflow-hidden rounded-3xl border px-8 py-14 text-center md:px-16">
              <div aria-hidden className="landing-cta-band-glow" />
              <h2 className="text-foreground relative text-2xl font-semibold tracking-tight sm:text-3xl">
                Sẵn sàng mở chapter đầu tiên?
              </h2>
              <p className="text-muted-foreground relative mx-auto mt-3 max-w-lg">
                Không cần cài đặt phức tạp — chỉ cần trình duyệt hiện đại và ý
                tưởng của bạn.
              </p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="landing-cta inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold"
                >
                  Mở Novel Studio
                </Link>
                <Link
                  href="/feedback"
                  className="landing-ghost inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium"
                >
                  Gửi phản hồi
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-border border-t px-5 py-10 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
            <p>© {new Date().getFullYear()} Novel Studio</p>
            <p className="max-w-md sm:text-right">
              Ứng dụng chạy cục bộ; kết nối mạng dùng cho AI theo cấu hình của
              bạn.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
