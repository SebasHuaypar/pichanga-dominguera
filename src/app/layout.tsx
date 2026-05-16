import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Pichanga Dominguera | Año 2026",
  description: "Sigue el fixture, tabla de posiciones y resultados del torneo más picante de los domingos.",
  icons: {
    icon: "/images/logo_vecinos.svg",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="overflow-x-hidden">
      <body className={cn(outfit.variable, "font-sans antialiased bg-background text-foreground overflow-x-hidden")}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
