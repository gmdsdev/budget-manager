/**
 * The home-screen widget target. `@bacons/apple-targets` links this folder into the
 * generated Xcode project on every `expo prebuild`, which is what lets the widget be
 * real native code without checking `ios/` into the repo.
 *
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = (config) => ({
  type: "widget",
  name: "KivoWidget",
  icon: "../../assets/icon.png",
  frameworks: ["SwiftUI", "WidgetKit", "AppIntents"],

  // The widget is the third renderer of this design language, after the web's CSS
  // custom properties and `src/theme/tokens.ts`. Only the brand pair reaches it, and
  // that pair is the one part of the palette that deliberately does *not* flip with
  // the mode — bright green with forest-green ink is the brand, exactly as on the
  // dashboard hero this widget is a shrunken reading of.
  colors: {
    $widgetBackground: "#9fe870",
    $accent: "#163300",
    widgetInk: "#163300",
  },

  // Mirrors the app's own group rather than declaring a second one: the shared
  // `UserDefaults` suite is the only channel between the two, so a mismatch here
  // would leave the widget reading an empty container with no error to show for it.
  entitlements: {
    "com.apple.security.application-groups":
      config.ios.entitlements["com.apple.security.application-groups"],
  },
});
