import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "ValoStrat – Valorant Strategy Board",
  description: "Share and discuss Valorant map strategies, lineups, and setups.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Navbar />
        <main className="container mt-8 flex-1">
          {children}
        </main>
        <footer className="footer mt-8 py-4 text-center text-muted border-t border-val-border">
          <p>© 2026 ValoStrat. Not affiliated with Riot Games.</p>
        </footer>
      </body>
    </html>
  );
}
