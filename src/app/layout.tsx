import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { BottomNav } from "@/components/BottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Choice · Daily Fertility Feelings",
  description:
    "A calm, reflective space for women undecided about motherhood to track daily desire alongside their cycles.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "The Choice",
  },
};

export const viewport: Viewport = {
  themeColor: "#8A9A5B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-[#FDFBF7] text-[#3F3A33]`}
      >
        {children}
        <BottomNav />
        <Toaster
          position="top-center"
          style={{ marginTop: "calc(env(safe-area-inset-top, 40px) + 10px)" }}
          toastOptions={{
            classNames: {
              toast:
                "rounded-2xl bg-white/95 border border-[color:var(--sage-soft)] text-[#3F3A33] shadow-sm",
              title: "heading-serif text-sm",
              description: "text-xs text-[#6F685E]",
            },
          }}
        />
      </body>
    </html>
  );
}
