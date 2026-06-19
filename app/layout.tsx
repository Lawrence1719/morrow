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

export const metadata: Metadata = {
  title: "morrow — world mood map",
  description: "An anonymous, geolocated map of human emotion. Share how you are feeling right now and see thoughts from around the globe.",
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
