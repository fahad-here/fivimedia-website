import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProgressIndicator from "@/components/wizard/ProgressIndicator";
import { useWizard } from "@/contexts/WizardContext";
import { locales, type Locale } from "@/i18n/config";

interface State {
  code: string;
  name: string;
  basePrice: number;
  isRecommended: boolean;
}

interface StartPageProps {
  states: State[];
  locale: Locale;
}

const RECOMMENDED_STATES = ["WY", "FL", "TX", "MT", "NM"];

export default function StartPage({ states, locale }: StartPageProps) {
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { state: wizardState, setEntityType, setState } = useWizard();

  const [selectedEntity, setSelectedEntity] = useState(wizardState.entityType || "LLC");
  const [selectedState, setSelectedState] = useState(wizardState.stateCode || "");

  const recommendedStates = states.filter((s) => RECOMMENDED_STATES.includes(s.code));
  const allStates = states.sort((a, b) => a.name.localeCompare(b.name));

  const canContinue = selectedEntity && selectedState;

  useEffect(() => {
    setEntityType(selectedEntity);
  }, [selectedEntity, setEntityType]);

  useEffect(() => {
    if (selectedState) {
      const stateData = states.find((s) => s.code === selectedState);
      if (stateData) {
        setState(stateData.code, stateData.name);
      }
    }
  }, [selectedState, setState, states]);

  const handleContinue = () => {
    if (canContinue) {
      router.push(`/${locale}/start/${selectedState}/included`);
    }
  };

  const handleRecommendedClick = (code: string) => {
    setSelectedState(code);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4">
          <ProgressIndicator currentStep={1} totalSteps={4} />

          <div className="bg-card rounded-xl p-8 shadow-sm border border-border">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("selectEntity")}
                </label>
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="LLC">LLC (Limited Liability Company)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("selectState")}
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t("selectState")}</option>
                  {allStates.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">
                  {t("recommended")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {recommendedStates.map((state) => (
                    <button
                      key={state.code}
                      onClick={() => handleRecommendedClick(state.code)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        selectedState === state.code
                          ? "bg-primary text-white border-primary"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {state.code}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  const paths = locales.map((locale) => ({
    params: { locale },
  }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<StartPageProps> = async ({ params }) => {
  const locale = (params?.locale as Locale) || "en";
  const messages = (await import(`@/messages/${locale}.json`)).default;

  // Fetch states from API at build time or use static data
  // For now, using static recommended states
  const states: State[] = [
    { code: "WY", name: "Wyoming", basePrice: 199, isRecommended: true },
    { code: "FL", name: "Florida", basePrice: 249, isRecommended: true },
    { code: "TX", name: "Texas", basePrice: 299, isRecommended: true },
    { code: "MT", name: "Montana", basePrice: 199, isRecommended: true },
    { code: "NM", name: "New Mexico", basePrice: 199, isRecommended: true },
    { code: "DE", name: "Delaware", basePrice: 349, isRecommended: false },
    { code: "NV", name: "Nevada", basePrice: 299, isRecommended: false },
    { code: "CA", name: "California", basePrice: 399, isRecommended: false },
    { code: "NY", name: "New York", basePrice: 399, isRecommended: false },
    { code: "AL", name: "Alabama", basePrice: 249, isRecommended: false },
    { code: "AK", name: "Alaska", basePrice: 299, isRecommended: false },
    { code: "AZ", name: "Arizona", basePrice: 249, isRecommended: false },
    { code: "AR", name: "Arkansas", basePrice: 249, isRecommended: false },
    { code: "CO", name: "Colorado", basePrice: 249, isRecommended: false },
    { code: "CT", name: "Connecticut", basePrice: 299, isRecommended: false },
    { code: "GA", name: "Georgia", basePrice: 249, isRecommended: false },
    { code: "HI", name: "Hawaii", basePrice: 299, isRecommended: false },
    { code: "ID", name: "Idaho", basePrice: 249, isRecommended: false },
    { code: "IL", name: "Illinois", basePrice: 299, isRecommended: false },
    { code: "IN", name: "Indiana", basePrice: 249, isRecommended: false },
    { code: "IA", name: "Iowa", basePrice: 249, isRecommended: false },
    { code: "KS", name: "Kansas", basePrice: 249, isRecommended: false },
    { code: "KY", name: "Kentucky", basePrice: 249, isRecommended: false },
    { code: "LA", name: "Louisiana", basePrice: 249, isRecommended: false },
    { code: "ME", name: "Maine", basePrice: 249, isRecommended: false },
    { code: "MD", name: "Maryland", basePrice: 299, isRecommended: false },
    { code: "MA", name: "Massachusetts", basePrice: 349, isRecommended: false },
    { code: "MI", name: "Michigan", basePrice: 249, isRecommended: false },
    { code: "MN", name: "Minnesota", basePrice: 249, isRecommended: false },
    { code: "MS", name: "Mississippi", basePrice: 249, isRecommended: false },
    { code: "MO", name: "Missouri", basePrice: 249, isRecommended: false },
    { code: "NE", name: "Nebraska", basePrice: 249, isRecommended: false },
    { code: "NH", name: "New Hampshire", basePrice: 249, isRecommended: false },
    { code: "NJ", name: "New Jersey", basePrice: 299, isRecommended: false },
    { code: "NC", name: "North Carolina", basePrice: 249, isRecommended: false },
    { code: "ND", name: "North Dakota", basePrice: 249, isRecommended: false },
    { code: "OH", name: "Ohio", basePrice: 249, isRecommended: false },
    { code: "OK", name: "Oklahoma", basePrice: 249, isRecommended: false },
    { code: "OR", name: "Oregon", basePrice: 249, isRecommended: false },
    { code: "PA", name: "Pennsylvania", basePrice: 299, isRecommended: false },
    { code: "RI", name: "Rhode Island", basePrice: 249, isRecommended: false },
    { code: "SC", name: "South Carolina", basePrice: 249, isRecommended: false },
    { code: "SD", name: "South Dakota", basePrice: 249, isRecommended: false },
    { code: "TN", name: "Tennessee", basePrice: 249, isRecommended: false },
    { code: "UT", name: "Utah", basePrice: 249, isRecommended: false },
    { code: "VT", name: "Vermont", basePrice: 249, isRecommended: false },
    { code: "VA", name: "Virginia", basePrice: 249, isRecommended: false },
    { code: "WA", name: "Washington", basePrice: 299, isRecommended: false },
    { code: "WV", name: "West Virginia", basePrice: 249, isRecommended: false },
    { code: "WI", name: "Wisconsin", basePrice: 249, isRecommended: false },
    { code: "DC", name: "District of Columbia", basePrice: 349, isRecommended: false },
  ];

  return {
    props: {
      states,
      locale,
      messages,
    },
  };
};
