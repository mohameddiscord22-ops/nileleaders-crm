/**
 * Call this once from your app entry point (e.g. main.tsx), after the app
 * mounts:
 *
 *   import { registerServiceWorker } from "@/registerServiceWorker";
 *   registerServiceWorker();
 */
export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return; // skip in dev to avoid caching issues while iterating

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch(err => console.warn("[PWA] Service worker registration failed:", err));
  });
}
