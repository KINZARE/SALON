import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";

const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-onest",
});

export const metadata: Metadata = {
  title: { default: "SALON", template: "%s · SALON" },
  description: "Rustige planning en salonbeheer voor kleine salons.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={onest.variable}>
      <body>{children}</body>
    </html>
  );
}
