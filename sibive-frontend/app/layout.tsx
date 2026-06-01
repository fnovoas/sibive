import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiBIVe",
  description: "Sistema Blockchain para Inspección de Vehículos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
