import SwiftUI
import WidgetKit

/// The brand pair, read from the colorsets `expo-target.config.js` generates so the
/// hex lives in one place per target rather than being typed again here.
///
/// Type is **SF, not Inter.** The app bundles Inter for its own renderer, but a widget
/// extension has its own bundle and its own font registration, and a home-screen widget
/// set in the system face reads as part of iOS rather than as a web page pasted onto it.
/// The scale below is this surface's own: a widget is a tenth the size of the dashboard
/// hero, so it cannot borrow that hero's 60pt step.
enum WidgetTheme {
  static let plane = Color("$widgetBackground")
  static let ink = Color("widgetInk")

  /// Opacities rather than extra colours, the same way the hero softens its own label:
  /// one ink at three strengths cannot drift out of step with itself.
  static let labelOpacity: Double = 0.6
  static let metaOpacity: Double = 0.7
  static let ruleOpacity: Double = 0.15
}

private struct Eyebrow: View {
  let text: String

  var body: some View {
    Text(text.uppercased())
      .font(.system(size: 11, weight: .semibold))
      .tracking(0.4)
      .foregroundStyle(WidgetTheme.ink.opacity(WidgetTheme.labelOpacity))
      .lineLimit(1)
  }
}

private struct Figure: View {
  let text: String
  let size: CGFloat
  var weight: Font.Weight = .semibold

  var body: some View {
    Text(text)
      .font(.system(size: size, weight: weight))
      .foregroundStyle(WidgetTheme.ink)
      .lineLimit(1)
      // A balance is the one thing on the widget that must never be truncated: an
      // account an order of magnitude larger than the layout was drawn for still has
      // to be readable, so the figure comes down in size rather than ending in an
      // ellipsis.
      .minimumScaleFactor(0.5)
  }
}

/// Label left, figure right — the same grammar as `month-summary.tsx` on the phone,
/// and for the same reason: a row never runs out of room the way a column of tiles
/// does, in any currency or language.
private struct FigureRow: View {
  let label: String
  let text: String

  var body: some View {
    HStack(alignment: .firstTextBaseline, spacing: 8) {
      Text(label)
        .font(.system(size: 12))
        .foregroundStyle(WidgetTheme.ink.opacity(WidgetTheme.metaOpacity))
        .lineLimit(1)

      Spacer(minLength: 4)

      Text(text)
        .font(.system(size: 13, weight: .semibold))
        .foregroundStyle(WidgetTheme.ink)
        .lineLimit(1)
        .minimumScaleFactor(0.6)
    }
  }
}

/// The small family has no room for a word *and* a figure on one line, so the word
/// becomes an arrow and moves into the accessibility label. Down is money in, up is
/// money out — the direction a banking app already means by them.
private struct GlyphRow: View {
  let symbol: String
  let label: String
  let text: String

  var body: some View {
    HStack(spacing: 5) {
      Image(systemName: symbol)
        .font(.system(size: 10, weight: .bold))
        .foregroundStyle(WidgetTheme.ink.opacity(WidgetTheme.metaOpacity))

      Text(text)
        .font(.system(size: 13, weight: .semibold))
        .foregroundStyle(WidgetTheme.ink)
        .lineLimit(1)
        .minimumScaleFactor(0.6)

      Spacer(minLength: 0)
    }
    .accessibilityElement(children: .ignore)
    .accessibilityLabel("\(label), \(text)")
  }
}

private struct SmallLayout: View {
  let labels: WidgetLabels
  let currency: WidgetCurrency

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      Eyebrow(text: labels.balance)
      Figure(text: currency.balance.text, size: 24, weight: .bold)
        .padding(.top, 2)

      Spacer(minLength: 8)

      Rectangle()
        .fill(WidgetTheme.ink.opacity(WidgetTheme.ruleOpacity))
        .frame(height: 1)
        .padding(.bottom, 8)

      VStack(alignment: .leading, spacing: 5) {
        GlyphRow(
          symbol: "arrow.down",
          label: labels.income,
          text: currency.income.text
        )
        GlyphRow(
          symbol: "arrow.up",
          label: labels.expense,
          text: currency.expense.text
        )
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

private struct MediumLayout: View {
  let snapshot: WidgetSnapshot
  let currency: WidgetCurrency

  var body: some View {
    HStack(alignment: .top, spacing: 14) {
      VStack(alignment: .leading, spacing: 0) {
        Eyebrow(text: snapshot.labels.balance)
        Figure(text: currency.balance.text, size: 28, weight: .bold)
          .padding(.top, 2)

        // Nothing here is ever summed across currencies, so the plane has to say
        // which one it is reporting — the same line the dashboard hero carries.
        Text("\(currency.code) · \(currency.monthLabel)")
          .font(.system(size: 11))
          .foregroundStyle(WidgetTheme.ink.opacity(WidgetTheme.metaOpacity))
          .lineLimit(1)
          .minimumScaleFactor(0.8)
          .padding(.top, 4)

        Spacer(minLength: 4)

        // A figure the app pushed is only as fresh as the last time the app ran, and
        // a widget that hides that is a widget that quietly lies. Stating when the
        // reading was taken is what makes a stale one obvious.
        Text(snapshot.updatedAtLabel)
          .font(.system(size: 10))
          .foregroundStyle(WidgetTheme.ink.opacity(WidgetTheme.labelOpacity))
          .lineLimit(1)
          .minimumScaleFactor(0.8)
      }
      .frame(maxWidth: .infinity, alignment: .leading)

      Rectangle()
        .fill(WidgetTheme.ink.opacity(WidgetTheme.ruleOpacity))
        .frame(width: 1)

      VStack(alignment: .leading, spacing: 10) {
        FigureRow(label: snapshot.labels.income, text: currency.income.text)
        FigureRow(label: snapshot.labels.expense, text: currency.expense.text)

        Rectangle()
          .fill(WidgetTheme.ink.opacity(WidgetTheme.ruleOpacity))
          .frame(height: 1)

        FigureRow(label: snapshot.labels.net, text: currency.net.text)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

/// Shown until the app has run once, and again after a sign-out clears the snapshot —
/// a balance must not outlive the session it belongs to on a surface anyone holding
/// the phone can read.
private struct EmptyLayout: View {
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Image(systemName: "chart.pie")
        .font(.system(size: 18, weight: .semibold))
        .foregroundStyle(WidgetTheme.ink.opacity(WidgetTheme.metaOpacity))

      Text("Open Kivo to sync your balance.")
        .font(.system(size: 13, weight: .medium))
        .foregroundStyle(WidgetTheme.ink)
        .lineLimit(3)
        .minimumScaleFactor(0.8)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

struct BalanceWidgetView: View {
  @Environment(\.widgetFamily) private var family

  let entry: BalanceEntry

  var body: some View {
    content
      // Tapping any part of the widget opens the app rather than a deep link into a
      // sub-screen: the figures here are the dashboard's, so the dashboard is where
      // the reader is already heading.
      .widgetURL(URL(string: "kivo://"))
  }

  @ViewBuilder
  private var content: some View {
    if let snapshot = entry.snapshot, let currency = entry.currency {
      switch family {
      case .systemSmall:
        SmallLayout(labels: snapshot.labels, currency: currency)
      default:
        MediumLayout(snapshot: snapshot, currency: currency)
      }
    } else {
      EmptyLayout()
    }
  }
}
