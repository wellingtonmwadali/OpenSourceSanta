import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSS Compass – Find Your Open Source Home",
  description: "AI-powered open source project discovery tailored to your skills and interests.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
