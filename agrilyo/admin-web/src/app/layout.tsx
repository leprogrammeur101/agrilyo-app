import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AGRILYO — Back-office",
  description: "Administration AGRILYO : validations, litiges, KPIs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}