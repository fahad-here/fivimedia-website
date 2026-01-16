import Link from "next/link";
import { useTranslations } from "next-intl";
import { GetStaticProps, GetStaticPaths } from "next";
import Layout from "@/components/Layout";
import Button from "@/components/ui/Button";
import { locales } from "@/i18n/config";

interface LLCFormationProps {
  locale: string;
}

export default function LLCFormation({ locale }: LLCFormationProps) {
  const t = useTranslations("llcFormation");
  const tCommon = useTranslations("common");

  const benefits = [
    t("benefit1"),
    t("benefit2"),
    t("benefit3"),
    t("benefit4"),
    t("benefit5"),
    t("benefit6"),
  ];

  const whatWeHandle = [
    t("handle1"),
    t("handle2"),
    t("handle3"),
    t("handle4"),
    t("handle5"),
    t("handle6"),
    t("handle7"),
  ];

  return (
    <Layout>
      <div className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
              {t("title")}
            </h1>
            <p className="text-lg text-[var(--foreground-muted)]">
              {t("subtitle")}
            </p>
          </div>

          {/* What is an LLC */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              {t("whatIsLlc")}
            </h2>
            <p className="text-[var(--foreground-muted)] mb-4">
              {t("whatIsLlcDescription")}
            </p>
            <p className="text-[var(--foreground-muted)]">
              {t("whatIsLlcDescription2")}
            </p>
          </section>

          {/* Benefits */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              {t("benefitsTitle")}
            </h2>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[var(--color-success)] flex-shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[var(--foreground)]">{benefit}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* What We Handle */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              {t("whatWeHandleTitle")}
            </h2>
            <p className="text-[var(--foreground-muted)] mb-4">
              {t("whatWeHandleDescription")}
            </p>
            <ul className="space-y-3">
              {whatWeHandle.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[var(--color-primary)] flex-shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[var(--foreground)]">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* CTA Banner */}
          <section className="bg-[var(--background-muted)] rounded-xl p-8 text-center border border-[var(--border)]">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              {t("ctaTitle")}
            </h2>
            <p className="text-[var(--foreground-muted)] mb-6">
              {t("ctaDescription")}
            </p>
            <Link href={`/${locale}/start`}>
              <Button size="lg">{tCommon("getStarted")}</Button>
            </Link>
          </section>
        </div>
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: locales.map((locale) => ({ params: { locale } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const locale = params?.locale as string;

  return {
    props: {
      locale,
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
  };
};
