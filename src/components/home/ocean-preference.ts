"use client";

/**
 * The visitor's pause choice, as an external store.
 *
 * Reading `sessionStorage` inside an effect and calling `setState` with the
 * result is the obvious implementation and the wrong one: it renders once with
 * the default, then again with the stored value, which the React Compiler lint
 * flags as a cascading render and which shows as a visible flicker of the wrong
 * control label on a slow device.
 *
 * `useSyncExternalStore` is the shape this actually is — a value owned by a
 * platform API that React subscribes to. The server snapshot is `false`, so the
 * markup always renders "Pause background" and hydration cannot mismatch; the
 * client snapshot reads storage during render, so the correct label is in the
 * first committed frame rather than the second.
 */

const KEY = "foundry:ocean-paused";

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === "true";
  } catch {
    // Storage can be blocked outright. The control still works for this page;
    // it just does not persist, which is the correct degradation.
    return false;
  }
}

/** Never paused on the server: there is no session to read. */
function getServerSnapshot(): boolean {
  return false;
}

function setPaused(paused: boolean): void {
  try {
    window.sessionStorage.setItem(KEY, String(paused));
  } catch {
    // Non-fatal — see above. The listeners still fire so this page updates.
  }
  for (const listener of listeners) listener();
}

export const oceanPreference = { subscribe, getSnapshot, getServerSnapshot, setPaused };
