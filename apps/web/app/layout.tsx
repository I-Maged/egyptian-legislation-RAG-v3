import type { Metadata } from "next";
import Navbar, { NavbarProvider } from "./components/navbar";
import { UserProvider } from "./components/user-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "المساعد القانوني المصري",
  description: "مساعد قانوني تجريبي للتشريعات المصرية",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <UserProvider>
          <NavbarProvider>
            <Navbar />
            {children}
          </NavbarProvider>
        </UserProvider>
      </body>
    </html>
  );
}
