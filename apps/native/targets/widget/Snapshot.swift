import Foundation

/// The Swift half of the contract declared in
/// `apps/native/src/modules/widget/snapshot.ts`. Change one and change the other.
///
/// Every string here arrives **already translated and already formatted**. That is
/// deliberate: a widget extension cannot import `@budget-manager/i18n`, and a
/// `NumberFormatter` written beside `formatMinorUnits` would be a second money
/// implementation for the one currency it disagrees about. So the app resolves the
/// words and the figures, and this target only lays them out — which also means a
/// reworded message or a new locale reaches the widget with no Swift change at all.
struct WidgetFigure: Decodable {
  /// Minor units, carried alongside the text because *sign* is a layout decision
  /// (which way the net arrow points) and parsing it back out of a localized
  /// string would be its own bug.
  let cents: Int
  let text: String
}

struct WidgetCurrency: Decodable {
  let code: String
  let monthLabel: String
  let balance: WidgetFigure
  let income: WidgetFigure
  let expense: WidgetFigure
  let net: WidgetFigure
}

struct WidgetLabels: Decodable {
  let balance: String
  let income: String
  let expense: String
  let net: String
}

struct WidgetSnapshot: Decodable {
  let version: Int
  let updatedAtLabel: String
  let preferredCurrency: String
  let labels: WidgetLabels
  let currencies: [WidgetCurrency]
}

enum WidgetSnapshotStore {
  static let appGroup = "group.dev.gmds.kivo"
  static let key = "dashboardSnapshot"

  /// Bumping this in TypeScript without shipping a matching widget makes the widget
  /// fall back to its placeholder rather than misread a payload it does not know.
  static let supportedVersion = 1

  static func load() -> WidgetSnapshot? {
    guard
      let defaults = UserDefaults(suiteName: appGroup),
      let json = defaults.string(forKey: key),
      let data = json.data(using: .utf8),
      let snapshot = try? JSONDecoder().decode(WidgetSnapshot.self, from: data),
      snapshot.version == supportedVersion,
      !snapshot.currencies.isEmpty
    else {
      return nil
    }

    return snapshot
  }

  /// Resolves the currency this widget instance was configured with, falling back the
  /// same way the dashboard does: the account's preference, then the first code the
  /// API returned. A widget configured for a currency the account no longer holds must
  /// show *something* true rather than nothing.
  static func currency(
    matching code: String?,
    in snapshot: WidgetSnapshot
  ) -> WidgetCurrency? {
    if let code, let configured = snapshot.currencies.first(where: { $0.code == code }) {
      return configured
    }

    return snapshot.currencies.first { $0.code == snapshot.preferredCurrency }
      ?? snapshot.currencies.first
  }
}
