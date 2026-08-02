import { getErrorMessage } from "@budget-manager/client";
import { useTranslate } from "@budget-manager/i18n/react";

import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { SkeletonList } from "@/components/ui/skeleton";

/**
 * The three states every listing shares, so a screen states its own copy and
 * nothing else: loading, failed-with-a-retry, and empty — with a different empty
 * for a filtered list, since "nothing here" and "nothing matches" call for
 * different actions.
 */
export function ListLoading({ label }: { label: string }) {
  return <SkeletonList label={label} height={72} />;
}

export function ListError({
  title,
  error,
  onRetry,
  isRetrying,
}: {
  title: string;
  error: unknown;
  onRetry: () => void;
  isRetrying?: boolean;
}) {
  const t = useTranslate();

  return (
    <Empty
      title={title}
      description={getErrorMessage(error)}
      action={
        <Button
          label={isRetrying ? t("common.retrying") : t("common.retry")}
          loading={isRetrying}
          onPress={onRetry}
        />
      }
    />
  );
}
