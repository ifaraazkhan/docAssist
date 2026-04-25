import type { MetadataRoute } from "next";

const v = process.env.NEXT_PUBLIC_BUILD_ID || "dev";
const withVersion = (path: string) => `${path}?v=${v}`;

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "DrCliniq",
    short_name: "DrCliniq",
    description: "Smart WhatsApp assistant for Indian clinics",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#0d9488",
    orientation: "portrait",
    icons: [
      { src: withVersion("/branding/app-icon/android/mipmap-ldpi/dr-cliniq-icon.png"), sizes: "36x36", type: "image/png", purpose: "any" },
      { src: withVersion("/branding/app-icon/android/mipmap-mdpi/dr-cliniq-icon.png"), sizes: "48x48", type: "image/png", purpose: "any" },
      { src: withVersion("/branding/app-icon/android/mipmap-hdpi/dr-cliniq-icon.png"), sizes: "72x72", type: "image/png", purpose: "any" },
      { src: withVersion("/branding/app-icon/android/mipmap-xhdpi/dr-cliniq-icon.png"), sizes: "96x96", type: "image/png", purpose: "any" },
      { src: withVersion("/branding/app-icon/android/mipmap-xxhdpi/dr-cliniq-icon.png"), sizes: "144x144", type: "image/png", purpose: "any" },
      { src: withVersion("/branding/app-icon/android/mipmap-xxxhdpi/dr-cliniq-icon.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: withVersion("/branding/app-icon/android/playstore-icon.png"), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: withVersion("/branding/app-icon/android/mipmap-xxxhdpi/dr-cliniq-icon_foreground.png"), sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: withVersion("/branding/app-icon/android/ic_launcher-web.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
