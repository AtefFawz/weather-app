import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "@fontsource-variable/noto-sans-arabic";
import { AppRoot } from "@/app/app-root";
import { createAppStore } from "@/state/app-state";
import "@/styles/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

createRoot(root).render(
  <StrictMode>
    <AppRoot store={createAppStore()} />
  </StrictMode>,
);
