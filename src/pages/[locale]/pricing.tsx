import Link from "next/link";
import { useTranslations } from "next-intl";
import { GetStaticProps, GetStaticPaths } from "next";
import Layout from "@/components/Layout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { locales } from "@/i18n/config";

// Sample pricing data - In production, this would come from API
const exampleStates = [
  { code: "WY", name: "Wyoming", basePrice: 199, recommended: true },
  { code: "FL", name: "Florida", basePrice: 249, recommended: true },
  { code: "TX", name: "Texas", basePrice: 299, recommended: true },
  { code: "DE", name: "Delaware", basePrice: 349, recommended: false },
];

interface PricingProps {
  locale: string;
}

export default function Pricing({ locale }: PricingProps) {
  const t = useTranslations("pricing");
  const tCommon = useTranslations("common");
  const tHome = useTranslations("home");

  const addOns = [
    {
      name: t("bankSetup"),
      price: 99,
      description: t("bankSetupDesc"),
    },
    {
      name: t("businessAddress"),
      price: 49,
      description: t("businessAddressDesc"),
    },
    {
      name: t("usPhoneNumber"),
      price: 29,
      description: t("usPhoneNumberDesc"),
    },
  ];

  const includedItems = [
    tHome("einFiling"),
    tHome("registeredAgent"),
    tHome("mailingAddress"),
    tHome("boiFiling"),
    tHome("certificateGoodStanding"),
    t("operatingAgreement"),
  ];

  return (
    <Layout>
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
              {t("title")}
            </h1>
            <p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </div>

          {/* Example State Pricing */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 text-center">
              {t("examplePricing")}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {exampleStates.map((state) => (
                <Card key={state.code} className="p-6 relative">
                  {state.recommended && (
                    <span className="absolute top-4 end-4 bg-[var(--color-success)] text-white text-xs font-semibold px-2 py-1 rounded">
                      {t("popular")}
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
                    {state.name}
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)] mb-4">
                    {state.code} LLC
                  </p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-[var(--foreground)]">
                      ${state.basePrice}
                    </span>
                    <span className="text-[var(--foreground-muted)]"> {t("plusStateFees")}</span>
                  </div>
                  <Link href={`/${locale}/start`}>
                    <Button variant="outline" className="w-full">
                      {t("select")}
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
            <p className="text-center text-sm text-[var(--foreground-muted)] mt-4">
              {t("priceDisclaimer")}
            </p>
          </section>

          {/* Add-ons */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 text-center">
              {t("addOns")}
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {addOns.map((addon, index) => (
                <Card key={index} className="p-6">
                  <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                    {addon.name}
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)] mb-4">
                    {addon.description}
                  </p>
                  <p className="text-2xl font-bold text-[var(--color-primary)]">
                    +${addon.price}
                  </p>
                </Card>
              ))}
            </div>
          </section>

          {/* What's Included */}
          <section className="mb-16 bg-[var(--background-muted)] rounded-xl p-8 border border-[var(--border)]">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 text-center">
              {t("whatsIncluded")}
            </h2>
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {includedItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[var(--color-success)]">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[var(--foreground)]">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              {t("ctaTitle")}
            </h2>
            <p className="text-[var(--foreground-muted)] mb-6">
              {t("ctaDescription")}
            </p>
            <Link href={`/${locale}/start`}>
              <Button size="lg">{tCommon("startNow")}</Button>
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
