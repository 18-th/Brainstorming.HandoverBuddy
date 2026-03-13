import type { Metadata } from "next";
import "./globals.css";
import NextAuthSessionProvider from "@/components/session-provider";

export const metadata: Metadata = {
  title: "Handover Buddy",
  description: "Structured GitHub PR handovers for leave periods",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-primary antialiased">
        <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
      </body>
    </html>
  );
}
