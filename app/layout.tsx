import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FL-GA Future Student Pipeline",
  description: "County-level civic dashboard for births, migration, and enrollment pipeline risk."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
