import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach } from "bun:test";

/**
 * The hooks here are React hooks, so testing them needs a renderer and a DOM. The
 * package registers its own rather than borrowing an app's: a test belongs beside the
 * code it pins, and `apps/web`'s `bunfig.toml` is not this package's to depend on.
 */
GlobalRegistrator.register();

const { cleanup } = await import("@testing-library/react");

/**
 * Registered here rather than relying on `@testing-library/react`'s built-in
 * auto-cleanup: that registers its hook at import time, which Bun scopes to whichever
 * test file imports RTL *first*, so cleanup silently becomes filename-order-dependent.
 */
afterEach(cleanup);
