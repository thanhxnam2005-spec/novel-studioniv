import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import "./landing.css";

const landingFont = Newsreader({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-landing",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Novel Studio — Giới thiệu",
  description:
    "Không gian sáng tác tiểu thuyết local-first: AI đa nhà cung cấp, phân tích, Auto-Write, convert Trung–Việt, TTS và hơn thế nữa.",
  openGraph: {
    title: "Novel Studio",
    description:
      "Không gian sáng tác tiểu thuyết trong trình duyệt — dữ liệu của bạn, trên máy bạn.",
  },
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`landing-root min-h-svh ${landingFont.variable}`}
      style={{ fontFamily: "var(--font-landing), ui-serif, Georgia, serif" }}
    >
      <div className="landing-stack">{children}</div>
    </div>
  );
}
