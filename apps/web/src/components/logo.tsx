import { cn } from "@budget-manager/ui/lib/utils";

import logoLight from "@/assets/logo/svg/kivo-logo-black.svg";
import logoDark from "@/assets/logo/svg/kivo-logo-white.svg";
import markLight from "@/assets/logo/svg/kivo-mark-black.svg";
import markDark from "@/assets/logo/svg/kivo-mark-white.svg";
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
