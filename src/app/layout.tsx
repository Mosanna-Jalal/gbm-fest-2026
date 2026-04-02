import type { Metadata } from "next";
import { Poppins, Space_Grotesk } from "next/font/google";
import "./globals.css";

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GBM Fest Entry Console",
  description: "Centralized pass verification and gate movement logging for April 6 and 7 fest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col">
        <div className="water-bg" aria-hidden>
          <span className="wave-orb wave-orb-one" />
          <span className="wave-orb wave-orb-two" />
          <span className="wave-orb wave-orb-three" />
        </div>

        <header className="relative z-10 px-3 pt-3 sm:px-6 sm:pt-5">
          <div className="mx-auto max-w-6xl rounded-2xl border border-cyan-100/70 bg-white/65 px-4 py-3 shadow-md backdrop-blur-md">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-cyan-700 font-semibold">
              GBM FEST 2026
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <h1 className="text-base sm:text-xl font-bold text-slate-900">Centralized Entry Control Console</h1>
              <p className="text-[11px] sm:text-xs text-cyan-800/80">Smooth flow. Fast checks. Reliable security logs.</p>
            </div>
          </div>
        </header>

        <div className="relative z-10 flex-1">{children}</div>
        <footer className="relative z-10 px-4 py-4 text-center">
          <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800/10 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-900/95 px-4 py-3 shadow-md">
            <p className="text-xs sm:text-sm font-semibold text-cyan-100">
              Designed &amp; Developed by{" "}
              <span className="text-amber-300">Mosanna Jalal (MJX Cinematix Studio)</span>
            </p>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-200/90">
              © 2026 GBM Fest Entry Console. All Rights Reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
