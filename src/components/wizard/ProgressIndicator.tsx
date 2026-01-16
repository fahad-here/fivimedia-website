import { useTranslations } from "next-intl";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressIndicator({
  currentStep,
  totalSteps,
}: ProgressIndicatorProps) {
  const t = useTranslations("wizard");

  return (
    <div className="mb-8">
      <div className="text-sm text-muted-foreground mb-2">
        {t(`step${currentStep}Title`)}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${
              i < currentStep
                ? "bg-primary"
                : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
