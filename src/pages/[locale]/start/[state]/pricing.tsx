import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProgressIndicator from "@/components/wizard/ProgressIndicator";
import OrderSummary from "@/components/wizard/OrderSummary";
import PageLoader from "@/components/ui/PageLoader";
import { useWizard } from "@/contexts/WizardContext";
import { locales, type Locale } from "@/i18n/config";

interface AddOn {
  slug: string;
  name: string;
  description: string;
  price: number;
}

interface PricingPageProps {
  locale: Locale;
  stateCode: string;
}

export default function PricingPage({ locale, stateCode }: PricingPageProps) {
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const {
    state: wizardState,
    setState,
    setBasePrice,
    toggleAddOn,
  } = useWizard();

  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPricing() {
      try {
        // Fetch quote from server-authoritative API
        const response = await fetch("/api/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stateCode,
            addOnSlugs: [],
            locale,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setState(stateCode, data.stateName);
          setBasePrice(data.basePrice);
          setAddOns(data.availableAddOns || []);
        } else {
          setError(data.error || "Failed to fetch pricing");
        }
      } catch (err) {
        console.error("Failed to fetch pricing:", err);
        setError("Failed to fetch pricing");
      } finally {
        setLoading(false);
      }
    }

    fetchPricing();
  }, [stateCode, locale, setState, setBasePrice]);

  const handleAddOnToggle = (addOn: AddOn) => {
    toggleAddOn({
      slug: addOn.slug,
      name: addOn.name,
      price: addOn.price,
    });
  };

  const isAddOnSelected = (slug: string) => {
    return wizardState.selectedAddOns.some((a) => a.slug === slug);
  };

  const handleContinue = () => {
    router.push(`/${locale}/checkout`);
  };

  const handleBack = () => {
    router.push(`/${locale}/start/${stateCode}/included`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background py-12">
          <div className="max-w-4xl mx-auto px-4">
            <PageLoader message={t("loadingPricing")} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background py-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="bg-error/10 text-error p-4 rounded-lg mb-4">
              {error}
            </div>
            <p className="text-muted-foreground mb-4">
              Please make sure the database is seeded with state and add-on data.
            </p>
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
            >
              {tCommon("back")}
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-4xl mx-auto px-4">
          <ProgressIndicator currentStep={3} totalSteps={4} />

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-card rounded-xl p-8 shadow-sm border border-border">
                <h2 className="text-xl font-semibold mb-4">{t("basePrice")}</h2>
                <div className="text-3xl font-bold text-primary">
                  ${wizardState.basePrice}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {wizardState.stateName} LLC Formation
                </p>
              </div>

              <div className="bg-card rounded-xl p-8 shadow-sm border border-border">
                <h2 className="text-xl font-semibold mb-6">Add-ons</h2>
                <div className="space-y-4">
                  {addOns.map((addOn) => (
                    <label
                      key={addOn.slug}
                      className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                        isAddOnSelected(addOn.slug)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAddOnSelected(addOn.slug)}
                        onChange={() => handleAddOnToggle(addOn)}
                        className="mt-1 w-5 h-5 rounded border-border text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{addOn.name}</span>
                          <span className="font-semibold text-primary">
                            +${addOn.price}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {addOn.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 px-4 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  {tCommon("back")}
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                >
                  {t("continueToCheckout")}
                </button>
              </div>
            </div>

            <div className="md:sticky md:top-24 h-fit">
              <OrderSummary />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const states = [
    "WY", "FL", "TX", "MT", "NM", "DE", "NV", "CA", "NY", "AL",
    "AK", "AZ", "AR", "CO", "CT", "GA", "HI", "ID", "IL", "IN",
    "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS",
    "MO", "NE", "NH", "NJ", "NC", "ND", "OH", "OK", "OR", "PA",
    "RI", "SC", "SD", "TN", "UT", "VT", "VA", "WA", "WV", "WI", "DC"
  ];

  const paths: Array<{ params: { locale: string; state: string } }> = [];

  for (const locale of locales) {
    for (const state of states) {
      paths.push({
        params: { locale, state },
      });
    }
  }

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<PricingPageProps> = async ({ params }) => {
  const locale = (params?.locale as Locale) || "en";
  const stateCode = (params?.state as string) || "";
  const messages = (await import(`@/messages/${locale}.json`)).default;

  return {
    props: {
      locale,
      stateCode,
      messages,
    },
  };
};
