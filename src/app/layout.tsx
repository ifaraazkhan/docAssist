import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { Toaster } from "sonner";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const v = process.env.NEXT_PUBLIC_BUILD_ID || "dev";
const versioned = (path: string) => `${path}?v=${v}`;

export const metadata: Metadata = {
  title: "DrCliniq — Smart WhatsApp Assistant for Clinics",
  description:
    "Automate patient queries, triage urgent messages, and manage clinical protocols from a single dashboard.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DrCliniq",
  },
  icons: {
    icon: [
      { url: versioned("/branding/app-icon/android/mipmap-mdpi/dr-cliniq-icon.png"), sizes: "48x48", type: "image/png" },
      { url: versioned("/branding/app-icon/android/mipmap-xhdpi/dr-cliniq-icon.png"), sizes: "96x96", type: "image/png" },
      { url: versioned("/branding/app-icon/android/mipmap-xxxhdpi/dr-cliniq-icon.png"), sizes: "192x192", type: "image/png" },
      { url: versioned("/branding/app-icon/android/playstore-icon.png"), sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: versioned("/branding/app-icon/ios/AppIcon.appiconset/Icon-App-60x60@2x.png"), sizes: "120x120", type: "image/png" },
      { url: versioned("/branding/app-icon/ios/AppIcon.appiconset/Icon-App-60x60@3x.png"), sizes: "180x180", type: "image/png" },
      { url: versioned("/branding/app-icon/ios/AppIcon.appiconset/Icon-App-76x76@2x.png"), sizes: "152x152", type: "image/png" },
      { url: versioned("/branding/app-icon/ios/AppIcon.appiconset/Icon-App-83.5x83.5@2x.png"), sizes: "167x167", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <head />
      <body className="font-sans antialiased">
        <ServiceWorkerRegistrar />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "12px",
              fontSize: "14px",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
