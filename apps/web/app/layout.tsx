import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";

const fredrikaTheGreat = localFont({
  src:'./fonts/fredericka-the-great/FrederickatheGreat-Regular.ttf',
  variable:"--fredrika-font"
})

export const metadata: Metadata = {
  title: "Fomz",
  description: "Dynamic Conversational Form Builder SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fredrikaTheGreat.variable}`}>
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}
