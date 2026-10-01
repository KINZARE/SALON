import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Salon", template: "%s · Salon" },
  description: "Eenvoudige afspraken en salonbeheer voor kleine salons.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
