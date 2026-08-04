import ExpoModulesCore
import WidgetKit

/// The app's only way to reach the home-screen widget.
///
/// It deliberately knows nothing about the payload: the suite, the key and the JSON
/// all arrive from TypeScript, where the snapshot's shape is declared once in
/// `src/modules/widget/snapshot.ts`. Re-stating the contract here would be a second
/// place for it to drift.
public class WidgetBridgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WidgetBridge")

    AsyncFunction("setSnapshot") { (appGroup: String, key: String, json: String) in
      guard let defaults = UserDefaults(suiteName: appGroup) else {
        throw AppGroupUnavailableException(appGroup)
      }

      defaults.set(json, forKey: key)
      WidgetCenter.shared.reloadAllTimelines()
    }

    AsyncFunction("clearSnapshot") { (appGroup: String, key: String) in
      guard let defaults = UserDefaults(suiteName: appGroup) else {
        throw AppGroupUnavailableException(appGroup)
      }

      defaults.removeObject(forKey: key)
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}

/// A missing suite means the entitlement is not on the build, not that the write
/// failed — so it is worth saying which group could not be opened.
internal final class AppGroupUnavailableException: GenericException<String>,
  @unchecked Sendable
{
  override var reason: String {
    "Could not open the shared app group '\(param)'. Check the app's application-groups entitlement."
  }
}
