import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "@/app/components/ServiceWorkerRegistration";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Milasty Admin",
  description: "Milasty premium admin dashboard",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Milasty Admin",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/api/icon/16", sizes: "16x16", type: "image/png" },
      { url: "/api/icon/32", sizes: "32x32", type: "image/png" },
      { url: "/api/icon/192", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/api/icon/180", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1E0D04",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full antialiased">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
