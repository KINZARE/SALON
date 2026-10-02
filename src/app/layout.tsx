import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-urbanist",
});

export const metadata: Metadata = {
  title: { default: "SALON", template: "%s · SALON" },
  description: "Rustige planning en salonbeheer voor kleine salons.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={urbanist.variable}>
      <body>{children}</body>
    </html>
  );
}
