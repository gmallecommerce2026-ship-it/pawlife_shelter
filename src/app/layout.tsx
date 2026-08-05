// app/layout.tsx
import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PawLife Shelter Admin",
  description: "PawLife Shelter Admin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode; }) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body className={`${beVietnamPro.className} font-sans antialiased bg-white text-gray-900`}>
        {children}
      </body>
    </html>
  );
}