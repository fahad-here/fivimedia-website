import { useTranslations } from "next-intl";
import { useWizard } from "@/contexts/WizardContext";

export default function OrderSummary() {
  const t = useTranslations("wizard");
  const { state, getTotal } = useWizard();

  if (!state.stateCode) {
    return null;
  }

  return (
    <div className="bg-muted rounded-xl p-6">
      <h3 className="font-semibold mb-4">{t("orderSummary")}</h3>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">State:</span>
          <span className="font-medium">{state.stateName}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("basePrice")}:</span>
          <span className="font-medium">${state.basePrice}</span>
        </div>

        {state.selectedAddOns.length > 0 && (
          <>
            <div className="border-t border-border pt-3">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">
                Add-ons
              </span>
            </div>
            {state.selectedAddOns.map((addOn) => (
              <div key={addOn.slug} className="flex justify-between">
                <span className="text-muted-foreground">{addOn.name}</span>
                <span className="font-medium">${addOn.price}</span>
              </div>
            ))}
          </>
        )}

        <div className="border-t border-border pt-3 mt-3">
          <div className="flex justify-between text-base font-semibold">
            <span>{t("total")}:</span>
            <span className="text-primary">${getTotal()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
