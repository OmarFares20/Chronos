import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/Toaster";
import type { Metadata } from "next";


const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chronos — Timeless Events",
  description:
    "Chronos is a premium event-planning marketplace that connects visionaries with world-class service providers to craft timeless experiences.",
  keywords: ["event planning", "marketplace", "event services", "Chronos"],
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://chronos.app"),
  openGraph: {
    title:       "Chronos — Timeless Events",
    description: "Craft timeless experiences with Chronos.",
    type:        "website",
    url:         "/",
    images: [
      {
        url:    "/chronos-logo.webp",
        width:  512,
        height: 512,
        alt:    "Chronos — Timeless Events",
      },
    ],
  },
  twitter: {
    card:        "summary",
    title:       "Chronos — Timeless Events",
    description: "Craft timeless experiences with Chronos.",
    images:      ["/chronos-logo.webp"],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
