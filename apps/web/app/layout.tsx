import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Loom",
  description: "AI-powered email follow-up automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
