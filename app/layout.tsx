import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ITAD Triage App",
  description: "ITAD device intake and triage routing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--background)]">
        <header className="bg-[#0d0d0f] sticky top-0 z-10 shadow-md">
          <div className="mx-auto max-w-lg px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f2555a] to-[#e04449] flex items-center justify-center shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">ITAD Triage App</p>
                <p className="text-white/40 text-xs mt-0.5">Device Intake &amp; Routing</p>
              </div>
            </div>
            <a
              href="https://docs.google.com/spreadsheets/d/1LXddVic0lMt3WHsIcxsnXf3ybs8LQQHRg98RnJbUiQw/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white text-xs font-medium transition-colors"
            >
              Google Sheet ↗
            </a>
          </div>
          <div className="h-0.5 bg-gradient-to-r from-[#f2555a] via-[#f2555a]/60 to-transparent" />
        </header>

        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
