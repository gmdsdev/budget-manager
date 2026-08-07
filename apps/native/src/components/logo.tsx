import LogoLight from "@/assets/logo/svg/kivo-logo-black.svg";
import LogoDark from "@/assets/logo/svg/kivo-logo-white.svg";
import MarkLight from "@/assets/logo/svg/kivo-mark-black.svg";
import MarkDark from "@/assets/logo/svg/kivo-mark-white.svg";
import { useTheme } from "@/theme/theme-provider";

const LOGO_RATIO = 432 / 192;
const MARK_RATIO = 266 / 384;

/**
 * The app is Kivo, and the logo is a pair of files per shape rather than a
 * `currentColor` drawing — which is the whole reason there is no `system` theme:
 * a ternary cannot guess which artwork the OS is showing. The brand is
 * monochrome: ink on light, white on dark.
 *
 * The K is the wordmark's own capital letter, so there is no mark-plus-wordmark
 * lockup — the mark stands alone in the tight spots.
 */
export function KivoLogo({ height = 40 }: { height?: number }) {
  const { mode } = useTheme();
  const Artwork = mode === "dark" ? LogoDark : LogoLight;

  return (
    <Artwork
      height={height}
      width={height * LOGO_RATIO}
      accessibilityLabel="Kivo"
    />
  );
}

export function KivoMark({ height = 32 }: { height?: number }) {
  const { mode } = useTheme();
  const Artwork = mode === "dark" ? MarkDark : MarkLight;

  return (
    <Artwork
      height={height}
      width={height * MARK_RATIO}
      accessibilityLabel="Kivo"
    />
  );
}
