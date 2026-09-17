import type { Metadata } from "next";
import { Nunito, Poppins, Quicksand, Manrope } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Pasteur Jean-Marc GNALI — Enseignements",
    template: "%s — Pasteur Jean-Marc GNALI",
  },
  description:
    "Des enseignements pour comprendre, grandir et transmettre. Retrouvez les enseignements du Pasteur Jean-Marc GNALI en video, audio et PDF.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${nunito.variable} ${poppins.variable} ${quicksand.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ivory-100 text-ink-900">{children}</body>
    </html>
  );
}
