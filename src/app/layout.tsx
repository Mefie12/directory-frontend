import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
// import Navbar from "@/components/ui/navbar";
// import Footer from "@/components/ui/footer";
import LayoutWrapper from "@/components/layout-wrapper";

const gilroy = localFont({
  src: [
    {
      path: "../../public/fonts/Gilroy/Gilroy-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/Gilroy/Gilroy-ExtraBold.otf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-gilroy",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Me-fie Directory",
    default: "Me-fie Directory",
  },
  description:
    "Connect with African owned businesses, cultural events, and services across the diaspora and back home",
  keywords: [
    "Me-fie Directory",
    "African owned businesses",
    "Cultural events",
    "Services",
    "Diaspora",
    "Back home",
  ],
  authors: [{ name: "Me-fie" }],
  creator: "Me-fie",
  publisher: "Me-fie",
  icons: {
    icon: [{ url: "/images/logos/mefie-logo-2.svg", type: "image/svg+xml" }],
    shortcut: "/images/logos/mefie-logo-2.svg",
    apple: "/images/logos/mefie-logo-2.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mefiedirectory.com",
    siteName: "Me-fie Directory",
    title: "Me-fie Directory",
    description:
      "Connect with African owned businesses, cultural events, and services across the diaspora and back home",
    images: [
      {
        url: "https://mefiedirectory.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Me-fie Directory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Me-fie",
    description:
      "Connect with African owned businesses, cultural events, and services across the diaspora and back home",
    images: ["https://mefiedirectory.com/og-image.jpg"],
    creator: "@mefie",
  },
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://mefiedirectory.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${gilroy.variable} antialiased`}>
        {/* <Navbar /> */}
        <LayoutWrapper>
          <div className="font-gilroy">{children}</div>
        </LayoutWrapper>
        {/* <Footer /> */}
      </body>
    </html>
  );
}
