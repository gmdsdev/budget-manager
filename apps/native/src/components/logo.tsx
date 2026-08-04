import LogoLight from "@/assets/logo/svg/kivo-logo-forest.svg";
import LogoDark from "@/assets/logo/svg/kivo-logo-green.svg";
import MarkLight from "@/assets/logo/svg/kivo-mark-forest.svg";
import MarkDark from "@/assets/logo/svg/kivo-mark-green.svg";
import { useTheme } from "@/theme/theme-provider";

const LOGO_RATIO = 432 / 176;
const MARK_RATIO = 248 / 352;

/**
 * The app is Kivo, and the logo is a pair of files per shape rather than a
 * `currentColor` drawing — which is the whole reason there is no `system` theme:
 * a ternary cannot guess which artwork the OS is showing. Only forest-on-light
 * and green-on-dark are on-brand; bright green on white fails contrast.
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
