import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maison IA vivante",
  description: "Une maison virtuelle en perspective, quatre pièces et un jardin à ouvrir. Lia et Noé enquêtent, se découvrent et gardent leurs souvenirs.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
