import { Button } from "@budget-manager/ui/components/button";
import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  return (
    <div role="alert" className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mt-2 text-xs text-muted-foreground">
        {import.meta.env.DEV ? error.message : "Please try again."}
      </p>
      <Button
        className="mt-4"
        onClick={() => {
          reset();
          void router.invalidate();
        }}
      >
        Try again
      </Button>
    </div>
  );
}
