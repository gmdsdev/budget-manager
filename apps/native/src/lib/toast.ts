export type ToastTone = "success" | "error";

export type ToastAction = { label: string; onPress: () => void };

export type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
  action?: ToastAction;
};

type Listener = (toast: Toast) => void;

let nextId = 0;
let listener: Listener | null = null;

/**
 * A module-scoped emitter, so the `QueryCache`/`MutationCache` handlers and
 * `useApiMutation` can raise a toast the same way they do on the web — those run
 * outside React and have no component to hook into. `Toaster` is the single
 * subscriber and owns the rendering.
 */
export function subscribeToToasts(next: Listener) {
  listener = next;

  return () => {
    if (listener === next) {
      listener = null;
    }
  };
}

function emit(tone: ToastTone, message: string, action?: ToastAction) {
  listener?.({ id: nextId++, tone, message, action });
}

export const toast = {
  success: (message: string, options?: { action?: ToastAction }) =>
    emit("success", message, options?.action),
  error: (message: string, options?: { action?: ToastAction }) =>
    emit("error", message, options?.action),
};
