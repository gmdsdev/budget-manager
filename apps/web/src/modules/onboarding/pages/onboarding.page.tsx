import { useCompleteOnboardingMutation } from "@budget-manager/client/react";
import { useTranslate } from "@budget-manager/i18n/react";
import { Button } from "@budget-manager/ui/components/button";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { KivoLogo } from "@/components/logo";
import { OnboardingCardsStep } from "../components/onboarding-cards-step";
import { OnboardingCategoriesStep } from "../components/onboarding-categories-step";
import { OnboardingPreferencesStep } from "../components/onboarding-preferences-step";
import { OnboardingWalletsStep } from "../components/onboarding-wallets-step";

const STEP_COUNT = 4;

type OnboardingStep = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const t = useTranslate();
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>(1);
  const completeMutation = useCompleteOnboardingMutation();

  const complete = async () => {
    await completeMutation.mutateAsync();
    await navigate({ to: "/dashboard" });
  };

  const stepCopy = {
    1: {
      title: t("onboarding.preferences.title"),
      description: t("onboarding.preferences.description"),
    },
    2: {
      title: t("onboarding.wallets.title"),
      description: t("onboarding.wallets.description"),
    },
    3: {
      title: t("onboarding.cards.title"),
      description: t("onboarding.cards.description"),
    },
    4: {
      title: t("onboarding.categories.title"),
      description: t("onboarding.categories.description"),
    },
  }[step];

  return (
    <div className="flex items-start justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 sm:p-8 dark:border-transparent">
        <div className="mb-8 flex flex-col gap-6">
          <KivoLogo className="h-10 self-center" />
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.02em] text-muted-foreground">
              {t("onboarding.step", { step, total: STEP_COUNT })}
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.03em]">
              {stepCopy.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {stepCopy.description}
            </p>
          </div>
        </div>

        {step === 1 && <OnboardingPreferencesStep onSaved={() => setStep(2)} />}
        {step === 2 && <OnboardingWalletsStep />}
        {step === 3 && <OnboardingCardsStep />}
        {step === 4 && <OnboardingCategoriesStep />}

        {step > 1 && (
          <div className="flex flex-col gap-4 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep((step - 1) as OnboardingStep)}
                disabled={completeMutation.isPending}
              >
                {t("onboarding.back")}
              </Button>
              <div className="flex flex-wrap gap-3">
                {step < STEP_COUNT ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => void complete()}
                      disabled={completeMutation.isPending}
                    >
                      {completeMutation.isPending
                        ? t("onboarding.finishing")
                        : t("onboarding.skip")}
                    </Button>
                    <Button
                      onClick={() => setStep((step + 1) as OnboardingStep)}
                      disabled={completeMutation.isPending}
                    >
                      {t("onboarding.continue")}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => void complete()}
                    disabled={completeMutation.isPending}
                  >
                    {completeMutation.isPending
                      ? t("onboarding.finishing")
                      : t("onboarding.finish")}
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("onboarding.skipHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
