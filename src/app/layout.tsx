import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TripMate IITM",
  description: "Find travel buddies for trips to and from the IIT Mandi campus.",
};

export const viewport: Viewport = {
  themeColor: "#000c32",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${hanken.variable}`}>
      <body className="bg-background text-on-background font-body">{children}</body>
    </html>
  );
}
