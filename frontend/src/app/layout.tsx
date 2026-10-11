import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: { default: "PickleTayo", template: "%s · PickleTayo" },
  description: "Find courts, join your community, and play more pickleball.",
  icons: {
    icon: [
      { url: "/brand/pickletayo-mark.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "PickleTayo",
    description: "Find courts, join your community, and play more pickleball.",
    siteName: "PickleTayo",
    type: "website",
    images: [{ url: "/brand/pickletayo-social-1200x630.png", width: 1200, height: 630, alt: "PickleTayo" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
