import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/auth";
import { ApiError } from "@/lib/api";
import App from "./App";
import "./index.css";

const client = new QueryClient({ defaultOptions: { queries: {
  staleTime: 30_000, refetchOnWindowFocus: true,
  retry: (n, e) => !(e instanceof ApiError && e.status >= 400 && e.status < 500) && n < 2,
} } });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}><BrowserRouter><AuthProvider><App /><Toaster position="bottom-right" closeButton /></AuthProvider></BrowserRouter></QueryClientProvider>
  </React.StrictMode>
);
