import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/UI/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://morrow-world.vercel.app";

export const metadata: Metadata = {
  title: "morrow — world mood & notes map",
  description: "An anonymous, geolocated map of human emotion and notes. Share how you are feeling right now, drop a note on the map, and see thoughts from around the globe.",
  metadataBase: new URL(baseUrl),
  keywords: [
    "notes app",
    "anonymous notes",
    "geolocated notes",
    "world mood map",
    "human emotion map",
    "anonymous feelings sharing",
    "emotional geography",
    "global thoughts map",
    "mental health map",
    "interactive mood map",
    "map of notes",
    "morrow"
  ],
  authors: [{ name: "morrow team" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "morrow — world mood & notes map",
    description: "An anonymous, geolocated map of human emotion and notes. Share how you are feeling right now, drop a note on the map, and see thoughts from around the globe.",
    url: baseUrl,
    siteName: "morrow",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "morrow — world mood & notes map logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "morrow — world mood & notes map",
    description: "An anonymous, geolocated map of human emotion and notes. Share how you are feeling right now, drop a note on the map, and see thoughts from around the globe.",
    images: ["/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const now = new Date();
                  const phOptionsHour = { timeZone: 'Asia/Manila', hour: '2-digit', hour12: false };
                  const formatterHour = new Intl.DateTimeFormat('en-US', phOptionsHour);
                  const hour = parseInt(formatterHour.format(now), 10);
                  const isNight = hour >= 18 || hour < 6;
                  const color = isNight ? '#0b0f19' : '#f5f2eb';
                  document.documentElement.style.backgroundColor = color;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
