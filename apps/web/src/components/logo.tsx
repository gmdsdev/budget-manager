import { cn } from "@budget-manager/ui/lib/utils";

import logoLight from "@/assets/logo/svg/kivo-logo-forest.svg";
import logoDark from "@/assets/logo/svg/kivo-logo-green.svg";
import markLight from "@/assets/logo/svg/kivo-mark-forest.svg";
import markDark from "@/assets/logo/svg/kivo-mark-green.svg";
import { useThemeMode } from "@/components/theme-provider";

type LogoProps = Omit<React.ComponentProps<"img">, "src">;

export function KivoMark({ alt = "Kivo", className, ...props }: LogoProps) {
  const { mode } = useThemeMode();

  return (
    <img
      src={mode === "dark" ? markDark : markLight}
      alt={alt}
      className={cn("w-fit", className)}
      {...props}
    />
  );
}

export function KivoLogo({ alt = "Kivo", className, ...props }: LogoProps) {
  const { mode } = useThemeMode();

  return (
    <img
      src={mode === "dark" ? logoDark : logoLight}
      alt={alt}
      className={cn("w-fit", className)}
      {...props}
    />
  );
}
