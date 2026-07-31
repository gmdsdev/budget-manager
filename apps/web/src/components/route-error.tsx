import { Button } from "@budget-manager/ui/components/button";
import { useTranslate } from "@budget-manager/i18n/react";
import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";

export function RouteError({ error, reset }: ErrorComponentProps) {
  const t = useTranslate();
  const router = useRouter();

  return (
    <div role="alert" className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-lg font-semibold">{t("common.somethingWentWrong")}</h1>
      <p className="mt-2 text-xs text-muted-foreground">
        {import.meta.env.DEV ? error.message : t("common.pleaseTryAgain")}
      </p>
      <Button
        className="mt-4"
        onClick={() => {
          reset();
          void router.invalidate();
        }}
      >
        {t("common.tryAgain")}
      </Button>
    </div>
  );
}
