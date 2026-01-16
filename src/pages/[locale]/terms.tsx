import { useTranslations } from "next-intl";
import { GetStaticProps, GetStaticPaths } from "next";
import Layout from "@/components/Layout";
import { locales } from "@/i18n/config";

export default function Terms() {
  const t = useTranslations("terms");

  return (
    <Layout>
      <div className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-8">
            {t("title")}
          </h1>

          <div className="prose prose-lg max-w-none text-[var(--foreground)]">
            <p className="text-[var(--foreground-muted)] mb-6">
              {t("lastUpdated")}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">
                {t("section1Title")}
              </h2>
              <p className="text-[var(--foreground-muted)] mb-4">
                {t("section1Content")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">
                {t("section2Title")}
              </h2>
              <p className="text-[var(--foreground-muted)] mb-4">
                {t("section2Content")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">
                {t("section3Title")}
              </h2>
              <p className="text-[var(--foreground-muted)] mb-4">
                {t("section3Content")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">
                {t("section4Title")}
              </h2>
              <p className="text-[var(--foreground-muted)] mb-4">
                {t("section4Content")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">
                {t("section5Title")}
              </h2>
              <p className="text-[var(--foreground-muted)] mb-4">
                {t("section5Content")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">
                {t("section6Title")}
              </h2>
              <p className="text-[var(--foreground-muted)] mb-4">
                {t("section6Content")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">
                {t("section7Title")}
              </h2>
              <p className="text-[var(--foreground-muted)] mb-4">
                {t("section7Content")}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">
                {t("section8Title")}
              </h2>
              <p className="text-[var(--foreground-muted)] mb-4">
                {t("section8Content")}{" "}
                <a href="mailto:support@fivimedia.com" className="text-[var(--color-primary)] hover:underline">
                  support@fivimedia.com
                </a>
              </p>
            </section>
          </div>
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
