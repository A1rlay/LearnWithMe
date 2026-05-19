import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { Providers } from "@/app/providers";
import { HomeLogo } from "@/components/ui/home-logo";
import "./globals.css";

const sans = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LearnWithMe",
  description: "English listening practice with grammar topics and quiz checkpoints.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sans.variable}>
      <body className="min-h-screen antialiased">
        <Providers>
          <HomeLogo />
          {children}
        </Providers>
      </body>
    </html>
  );
}
