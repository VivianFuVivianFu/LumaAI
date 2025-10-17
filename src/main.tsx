import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { register as registerServiceWorker } from "./lib/serviceWorkerRegistration";
import { initSentry } from "./lib/sentry";

// Initialize error tracking (Sentry)
initSentry();

// Render the app
createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA functionality
registerServiceWorker({
  onSuccess: () => {
    console.log("✅ App is ready for offline use");
  },
  onUpdate: (registration) => {
    console.log("🔄 New version available! Please refresh.");
    // Optional: Show a toast notification to the user
    if (window.confirm("New version available! Reload to update?")) {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      window.location.reload();
    }
  },
});
