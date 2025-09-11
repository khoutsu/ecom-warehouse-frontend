import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./contexts/AuthContext";

export const metadata: Metadata = {
  title: "E-commerce Warehouse",
  description: "E-commerce Warehouse Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="h-full m-0 p-0" suppressHydrationWarning={true}>
        <AuthProvider>
          <div id="root">
            <Navbar />
            <main className="min-h-screen">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
