import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://inspirewithmusic.org"),
  title: {
    default: "Inspire With Music | Youth in Service",
    template: "%s | Inspire With Music",
  },
  description:
    "Young musicians turning talent into meaningful service through performance, teaching, mentorship, and community outreach.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Inspire With Music | Youth in Service",
    description: "Music in action. Youth in service.",
    url: "https://inspirewithmusic.org",
    siteName: "Inspire With Music",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inspire With Music | Youth in Service",
    description: "Music in action. Youth in service.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
