import { authClient } from "@/lib/auth-client";
import { toPreferredCurrency } from "@budget-manager/schemas";
import { buttonVariants } from "@budget-manager/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@budget-manager/ui/components/empty";
import { Skeleton } from "@budget-manager/ui/components/skeleton";
import { Link } from "@tanstack/react-router";
import { AppearanceForm } from "../components/appearance-form";
import { PasswordForm } from "../components/password-form";
import { PreferencesForm } from "../components/preferences-form";
import { ProfileForm } from "../components/profile-form";

export default function UserSettingsPage() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <div className="pb-8">
      <header className="flex flex-col gap-1 pt-6 pb-4 sm:pt-10">
        <h1 className="text-xl font-bold tracking-wide uppercase sm:text-2xl">
          User Settings
        </h1>
        <p className="text-xs text-muted-foreground">
          Your account details and the defaults the rest of the app reads.
        </p>
      </header>

      {isPending ? (
        <div
          role="status"
          aria-label="Loading settings"
          className="flex max-w-2xl flex-col gap-6"
        >
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-52 w-full" />
          ))}
        </div>
      ) : session ? (
        <div className="flex max-w-2xl flex-col gap-6">
          <ProfileForm name={session.user.name} email={session.user.email} />
          <PasswordForm />
          <AppearanceForm />
          <PreferencesForm
            preferredCurrency={toPreferredCurrency(
              session.user.preferredCurrency,
            )}
          />
        </div>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Session expired</EmptyTitle>
            <EmptyDescription>
              Sign in again to manage your settings.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/login" className={buttonVariants()}>
              Sign in
            </Link>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
