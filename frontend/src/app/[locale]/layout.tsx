import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/src/i18n/routing';

import RainbowKitAndWagmiProvider from "../RainbowKitAndWagmiProvider";
import Layout from "@/src/components/shared/PageLayout/Layout";
import { Toaster } from "@/src/components/ui/sonner"
import { getTranslations, setRequestLocale } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata(props: Omit<LayoutProps<'/[locale]'>, 'children'>) {
  const {locale} = await props.params;
  const t = await getTranslations({locale, namespace: 'HomePage'});
 
  return {
    title: t('title')
  };
}

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export default async function RootLayout({children, params}: Props) {

  // Ensure that the incoming `locale` is valid
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RainbowKitAndWagmiProvider>
          <NextIntlClientProvider>
            <Layout>
              {children}
            </Layout>
          </NextIntlClientProvider>
        </RainbowKitAndWagmiProvider>
        <Toaster richColors/>
      </body>
    </html>
  );
}
