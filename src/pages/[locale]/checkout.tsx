import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProgressIndicator from "@/components/wizard/ProgressIndicator";
import OrderSummary from "@/components/wizard/OrderSummary";
import { useWizard } from "@/contexts/WizardContext";
import { locales, type Locale } from "@/i18n/config";
import { sortedCountries } from "@/data/countries";

interface CheckoutPageProps {
  locale: Locale;
}

export default function CheckoutPage({ locale }: CheckoutPageProps) {
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { state: wizardState, setCustomerInfo, reset, getTotal } = useWizard();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    type: "percentage" | "fixed";
    value: number;
    discountAmount: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    fullName: wizardState.customerInfo.fullName,
    email: wizardState.customerInfo.email,
    phoneCode: wizardState.customerInfo.phoneCode || "+1",
    phone: wizardState.customerInfo.phone,
    country: wizardState.customerInfo.country,
    businessName: wizardState.customerInfo.businessName,
    notes: wizardState.customerInfo.notes,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setCustomerInfo({ [name]: value });
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return t("validation.fullNameRequired");
    if (!formData.email.trim()) return t("validation.emailRequired");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return t("validation.emailInvalid");
    if (!formData.phone.trim()) return t("validation.phoneRequired");
    // Validate phone number format (digits only, 6-15 characters)
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 6 || phoneDigits.length > 15) {
      return t("validation.phoneInvalid");
    }
    if (!formData.country.trim()) return t("validation.countryRequired");
    if (!formData.businessName.trim()) return t("validation.businessNameRequired");
    return null;
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError(t("validation.promoCodeRequired") || "Please enter a promo code");
      return;
    }

    setPromoLoading(true);
    setPromoError("");

    try {
      const orderTotal = getTotal();
      const response = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, orderTotal }),
      });

      const data = await response.json();

      if (data.valid && data.discount) {
        setAppliedPromo(data.discount);
        setPromoError("");
      } else {
        setPromoError(data.error || "Invalid promo code");
        setAppliedPromo(null);
      }
    } catch {
      setPromoError("Failed to validate promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
  };

  const getFinalTotal = () => {
    const total = getTotal();
    return appliedPromo ? total - appliedPromo.discountAmount : total;
  };

  const handlePlaceOrder = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Combine phone code and phone number
      const fullPhone = `${formData.phoneCode} ${formData.phone}`;

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stateCode: wizardState.stateCode,
          addOnSlugs: wizardState.selectedAddOns.map((a) => a.slug),
          customerInfo: {
            ...formData,
            phone: fullPhone,
          },
          promoCode: appliedPromo?.code || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Navigate first, then reset (reset after navigation completes)
        await router.push(`/${locale}/order/success?orderId=${data.orderId}`);
        reset();
        return; // Early return to prevent further state updates
      } else {
        setError(data.error || "Failed to place order");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Order submission error:", err);
      setError("Failed to place order. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push(`/${locale}/start/${wizardState.stateCode}/pricing`);
  };

  // Redirect to start if no state selected
  if (!wizardState.stateCode) {
    if (typeof window !== "undefined") {
      router.push(`/${locale}/start`);
    }
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-4xl mx-auto px-4">
          <ProgressIndicator currentStep={4} totalSteps={4} />

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-card rounded-xl p-8 shadow-sm border border-border">
                <h2 className="text-xl font-semibold mb-6">{t("customerInfo")}</h2>

                {error && (
                  <div className="mb-6 p-4 bg-error/10 text-error rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("fullName")} *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("email")} *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("phone")} *
                    </label>
                    <div className="flex gap-2">
                      <select
                        name="phoneCode"
                        value={formData.phoneCode}
                        onChange={handleInputChange}
                        className="w-28 px-3 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {sortedCountries.map((country) => (
                          <option key={country.code} value={country.phoneCode}>
                            {country.phoneCode}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="123 456 7890"
                        className="flex-1 px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("phoneHint")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("country")} *
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">{t("selectCountry")}</option>
                      {sortedCountries.map((country) => (
                        <option key={country.code} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("businessName")} *
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("notes")}
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? tCommon("loading") : t("placeOrder")}
                  </button>

                  <div className="text-center text-sm text-muted-foreground">
                    or
                  </div>

                  <button
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-[#635BFF] text-white rounded-lg font-medium hover:bg-[#5851db] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("stripeCheckout")}
                  </button>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleBack}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    &larr; {tCommon("back")}
                  </button>
                </div>
              </div>
            </div>

            <div className="md:sticky md:top-24 h-fit space-y-4">
              <OrderSummary />

              {/* Promo Code Section */}
              <div className="bg-muted rounded-xl p-6">
                <h3 className="font-semibold mb-4">{t("promoCode") || "Promo Code"}</h3>

                {appliedPromo ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-success/10 text-success p-3 rounded-lg">
                      <div>
                        <div className="font-medium">{appliedPromo.code}</div>
                        <div className="text-sm">
                          {appliedPromo.type === "percentage"
                            ? `${appliedPromo.value}% off`
                            : `$${appliedPromo.value} off`}
                        </div>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="text-sm hover:underline"
                      >
                        {t("remove") || "Remove"}
                      </button>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("discount") || "Discount"}:</span>
                      <span className="text-success font-medium">-${appliedPromo.discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="font-semibold">{t("finalTotal") || "Final Total"}:</span>
                      <span className="font-semibold text-primary">${getFinalTotal().toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder={t("enterPromoCode") || "Enter code"}
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={promoLoading}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                      >
                        {promoLoading ? "..." : t("apply") || "Apply"}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-sm text-error">{promoError}</p>
                    )}
                  </div>
                )}
              </div>
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

export const getStaticProps: GetStaticProps<CheckoutPageProps> = async ({ params }) => {
  const locale = (params?.locale as Locale) || "en";
  const messages = (await import(`@/messages/${locale}.json`)).default;

  return {
    props: {
      locale,
      messages,
    },
  };
};
