import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProgressIndicator from "@/components/wizard/ProgressIndicator";
import PageLoader from "@/components/ui/PageLoader";
import { useWizard } from "@/contexts/WizardContext";
import { locales, type Locale } from "@/i18n/config";

interface CoverageItem {
  key: string;
  title: string;
  description: string;
  processingTime: string | null;
}

interface IncludedPageProps {
  locale: Locale;
  stateCode: string;
}

export default function IncludedPage({ locale, stateCode }: IncludedPageProps) {
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { state: wizardState, setState, setBasePrice } = useWizard();

  const [coverage, setCoverage] = useState<CoverageItem[]>([]);
  const [stateName, setStateName] = useState(wizardState.stateName || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCoverage() {
      try {
        const response = await fetch(`/api/coverage?stateCode=${stateCode}&locale=${locale}`);
        const data = await response.json();

        if (data.success) {
          setCoverage(data.coverage || []);
          setStateName(data.stateName);
          setState(stateCode, data.stateName);
          setBasePrice(data.basePrice);
        } else {
          setError(data.error || "Failed to fetch coverage");
        }
      } catch (err) {
        console.error("Failed to fetch coverage:", err);
        setError("Failed to fetch coverage data");
      } finally {
        setLoading(false);
      }
    }

    fetchCoverage();
  }, [stateCode, locale, setState, setBasePrice]);

  const handleContinue = () => {
    router.push(`/${locale}/start/${stateCode}/pricing`);
  };

  const handleBack = () => {
    router.push(`/${locale}/start`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background py-12">
          <div className="max-w-2xl mx-auto px-4">
            <PageLoader message={t("loadingState")} />
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
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="bg-error/10 text-error p-4 rounded-lg mb-4">
              {error}
            </div>
            <p className="text-muted-foreground mb-4">
              Please make sure the database is seeded with state data.
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
        <div className="max-w-2xl mx-auto px-4">
          <ProgressIndicator currentStep={2} totalSteps={4} />

          <div className="bg-card rounded-xl p-8 shadow-sm border border-border">
            <h1 className="text-2xl font-bold mb-6">
              {t("includedTitle", { state: stateName })}
            </h1>

            <div className="space-y-4 mb-8">
              {coverage.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start gap-3 p-4 bg-muted rounded-lg"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-success/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-success"
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
                  <div>
                    <div className="font-medium">
                      {item.title}
                      {item.processingTime && (
                        <span className="text-muted-foreground ml-2 text-sm">
                          ({item.processingTime})
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <div className="font-medium text-warning">
                    {t("processingTime")}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Processing times may vary depending on state filing requirements and current workload.
                  </p>
                </div>
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
                {tCommon("continue")}
              </button>
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

export const getStaticProps: GetStaticProps<IncludedPageProps> = async ({ params }) => {
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
