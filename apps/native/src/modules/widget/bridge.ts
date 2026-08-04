import { requireOptionalNativeModule } from "expo";

type WidgetBridgeModule = {
  setSnapshot: (appGroup: string, key: string, json: string) => Promise<void>;
  clearSnapshot: (appGroup: string, key: string) => Promise<void>;
};

/**
 * The JS half of `apps/native/modules/widget-bridge`, which is autolinked from
 * outside `src/` because it is native code. It stays here rather than beside the
 * Swift so the feature reads as one directory and nothing has to import across the
 * `src` boundary.
 *
 * `requireOptional…` rather than `requireNativeModule`: the module declares only the
 * `apple` platform, so it is legitimately absent on Android and in any client built
 * before the widget existed. A missing module is then a no-op instead of a crash on
 * a platform that has no home-screen widget to feed.
 */
const native = requireOptionalNativeModule<WidgetBridgeModule>("WidgetBridge");

export async function setWidgetSnapshot(
  appGroup: string,
  key: string,
  json: string,
): Promise<void> {
  await native?.setSnapshot(appGroup, key, json);
}

export async function clearWidgetSnapshot(
  appGroup: string,
  key: string,
): Promise<void> {
  await native?.clearSnapshot(appGroup, key);
}
