import LockupDark from "@/assets/logos/kivo-lockup-dark.svg";
import LockupLight from "@/assets/logos/kivo-lockup.svg";
import MarkDark from "@/assets/logos/kivo-mark-dark.svg";
import MarkLight from "@/assets/logos/kivo-mark.svg";
import { useTheme } from "@/theme/theme-provider";

const LOCKUP_RATIO = 255 / 88;

/**
 * The app is Kivo, and the logo is a pair of files per shape rather than a
 * `currentColor` drawing — which is the whole reason there is no `system` theme:
 * a ternary cannot guess which artwork the OS is showing.
 *
 * The lockup carries the "Personal finance" tagline, so nothing should print a
 * second one beneath it; the mark is for the tight spots.
 */
export function KivoLockup({ height = 40 }: { height?: number }) {
  const { mode } = useTheme();
  const Artwork = mode === "dark" ? LockupDark : LockupLight;

  return (
    <Artwork
      height={height}
      width={height * LOCKUP_RATIO}
      accessibilityLabel="Kivo"
    />
  );
}

export function KivoMark({ size = 32 }: { size?: number }) {
  const { mode } = useTheme();
  const Artwork = mode === "dark" ? MarkDark : MarkLight;

  return <Artwork height={size} width={size} accessibilityLabel="Kivo" />;
}
