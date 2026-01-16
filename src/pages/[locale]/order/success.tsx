import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { locales, type Locale } from "@/i18n/config";

interface SuccessPageProps {
  locale: Locale;
}

export default function SuccessPage({ locale }: SuccessPageProps) {
  const t = useTranslations("orderSuccess");
  const router = useRouter();
  const { orderId } = router.query;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-card rounded-xl p-8 shadow-sm border border-border text-center">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>

            {orderId && (
              <div className="bg-muted rounded-lg p-4 mb-6">
                <div className="text-sm text-muted-foreground mb-1">
                  {t("orderIdLabel")}
                </div>
                <div className="font-mono text-lg font-semibold">{orderId}</div>
              </div>
            )}

            <div className="text-start bg-muted rounded-lg p-6 mb-8">
              <h2 className="font-semibold mb-3">{t("nextStepsTitle")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("nextStepsDescription")}
              </p>
            </div>

            <Link
              href={`/${locale}`}
              className="inline-block py-3 px-6 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              {t("backToHome")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = locales.map((locale) => ({
    params: { locale },
  }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<SuccessPageProps> = async ({ params }) => {
  const locale = (params?.locale as Locale) || "en";
  const messages = (await import(`@/messages/${locale}.json`)).default;

  return {
    props: {
      locale,
      messages,
    },
  };
};
