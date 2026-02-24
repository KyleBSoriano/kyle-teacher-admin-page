import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SettingsProvider } from "./context/SettingsContext.tsx";
import { Toaster } from "@/components/ui/toaster";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>
);
