import { trpc } from "@/lib/trpc";
import { app } from "@/lib/firebase"; // Import Firebase app

console.log("Firebase app initialized:", app);

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { registerServiceWorker } from "./registerServiceWorker";
import "./index.css";

// Register service worker for PWA support
registerServiceWorker();

const queryClient = new QueryClient();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: (import.meta.env.VITE_API_URL || "https://nileleaders-crm-production.up.railway.app") + "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
