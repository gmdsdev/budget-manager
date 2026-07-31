import { cn } from "@budget-manager/ui/lib/utils";

import lockupDark from "@/assets/logos/kivo-lockup-dark.svg";
import lockupLight from "@/assets/logos/kivo-lockup.svg";
import markDark from "@/assets/logos/kivo-mark-dark.svg";
import markLight from "@/assets/logos/kivo-mark.svg";
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

export function KivoLockup({ alt = "Kivo", className, ...props }: LogoProps) {
  const { mode } = useThemeMode();

  return (
    <img
      src={mode === "dark" ? lockupDark : lockupLight}
      alt={alt}
      className={cn("w-fit", className)}
      {...props}
    />
  );
}
