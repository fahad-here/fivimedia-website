import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { Inter } from "next/font/google";
import { getDirection, type Locale } from "@/i18n/config";
import { WizardProvider } from "@/contexts/WizardContext";

const inter = Inter({ subsets: ["latin"] });

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter();
  const locale = (router.query.locale as Locale) || "en";
  const direction = getDirection(locale);

  return (
    <SessionProvider session={session}>
      <NextIntlClientProvider
        locale={locale}
        messages={pageProps.messages}
        timeZone="UTC"
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <WizardProvider>
            <div dir={direction} className={inter.className}>
              <Component {...pageProps} />
            </div>
          </WizardProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
