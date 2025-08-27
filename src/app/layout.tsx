// src/app/layout.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

import "./globals.css";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import HeaderAuth from "@/components/HeaderAuth";
import Flash from "@/components/Flash";


export const metadata = {
  title: "Herzberger Spieletreff",
  description: "Spiele-Collection & Treff",
};

function ThemeScript() {
  const code = `
    try {
      var s = localStorage.getItem('hst-theme');
      var prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var dark = s ? s === 'dark' : prefers;
      var root = document.documentElement;
      if (dark) root.classList.add('dark'); else root.classList.remove('dark');
    } catch (e) {}
  `;
  // setzt dark/light noch vor dem ersten Paint
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen overflow-y-scroll bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-slate-100 transition-colors">
        <header className="border-b bg-white/80 dark:bg-slate-900/70 backdrop-blur transition-colors">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold">❤️ Herzberger Spieletreff</Link>

            <nav className="flex items-center gap-3">
              <ThemeToggle />
		<Link href="/news" className="header-link">News</Link>

              <Link href="/games/new" className="header-link">Neues Spiel</Link>
              <HeaderAuth /> {/* zeigt Login oder Logout (serverseitig) */}
            </nav>
          </div>
        </header>

        {/* <<< HIER: Flash-Banner global anzeigen */}
        <Flash />

        <main className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
