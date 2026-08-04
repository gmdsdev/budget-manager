import AppIntents
import SwiftUI
import WidgetKit

/// Offers the codes the account actually holds, read from the snapshot the app has
/// already written. There is no network here and no list of world currencies: a widget
/// can only ever report a currency the dashboard has figures for.
struct CurrencyOptionsProvider: DynamicOptionsProvider {
  func results() async throws -> [String] {
    WidgetSnapshotStore.load()?.currencies.map(\.code) ?? []
  }

  func defaultResult() async -> String? {
    WidgetSnapshotStore.load()?.preferredCurrency
  }
}

struct BalanceConfigurationIntent: WidgetConfigurationIntent {
  static var title: LocalizedStringResource = "Balance"
  static var description = IntentDescription(
    "Choose which currency this widget reports."
  )

  @Parameter(title: "Currency", optionsProvider: CurrencyOptionsProvider())
  var currency: String?
}

struct BalanceEntry: TimelineEntry {
  let date: Date
  let snapshot: WidgetSnapshot?
  let currency: WidgetCurrency?
}

struct BalanceProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> BalanceEntry {
    BalanceEntry(date: Date(), snapshot: nil, currency: nil)
  }

  func snapshot(
    for configuration: BalanceConfigurationIntent,
    in context: Context
  ) async -> BalanceEntry {
    entry(for: configuration)
  }

  /// One entry, and `.never`.
  ///
  /// Nothing about these figures changes with the clock — they move when a transaction
  /// does, and the app reloads the timeline itself the moment it writes a new snapshot.
  /// Scheduling refreshes ahead would spend the widget's reload budget re-reading a
  /// file that had not changed.
  func timeline(
    for configuration: BalanceConfigurationIntent,
    in context: Context
  ) async -> Timeline<BalanceEntry> {
    Timeline(entries: [entry(for: configuration)], policy: .never)
  }

  private func entry(for configuration: BalanceConfigurationIntent) -> BalanceEntry {
    let snapshot = WidgetSnapshotStore.load()

    return BalanceEntry(
      date: Date(),
      snapshot: snapshot,
      currency: snapshot.flatMap {
        WidgetSnapshotStore.currency(matching: configuration.currency, in: $0)
      }
    )
  }
}

struct BalanceWidget: Widget {
  var body: some WidgetConfiguration {
    AppIntentConfiguration(
      kind: "KivoBalanceWidget",
      intent: BalanceConfigurationIntent.self,
      provider: BalanceProvider()
    ) { entry in
      BalanceWidgetView(entry: entry)
        .containerBackground(for: .widget) { WidgetTheme.plane }
    }
    .configurationDisplayName("Balance")
    .description("Your balance, income and expenses this month.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

@main
struct KivoWidgetBundle: WidgetBundle {
  var body: some Widget {
    BalanceWidget()
  }
}
