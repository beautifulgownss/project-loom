import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outreach Studio - AI-Powered Email Automation",
  description: "Automate your email follow-ups with intelligent AI. Manage sequences, maintain brand voice, and boost reply rates with Outreach Studio.",
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
