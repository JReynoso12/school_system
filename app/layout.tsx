import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Schoooli - School Management System",
  description: "K-12 and College exam administration and grading SaaS platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
