import type { ReactNode } from "react";

/**
 * Every screen opens the same way: title, an optional line of context under it,
 * and the actions or scoping controls opposite. Seven pages spelling that out
 * themselves is seven chances for one to drift.
 */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 pt-6 pb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:pt-10">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-[-0.04em] sm:text-[2rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex flex-row flex-wrap items-center gap-2">
          {children}
        </div>
      ) : null}
    </header>
  );
}
