import type { Metadata, Viewport } from "next";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const notoSansSC = Noto_Sans_SC({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-noto-sans-sc",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a1a",
};

export const metadata: Metadata = {
  title: "驾考保卫战 - 宝可梦版",
  description: "一边答题一边打怪！宝可梦主题的驾考练习游戏",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "驾考保卫战",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={notoSansSC.variable}>
      <head>
        {/* Preconnect for any external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
      </head>
      <body style={{ fontFamily: "'Noto Sans SC', 'Microsoft YaHei', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
