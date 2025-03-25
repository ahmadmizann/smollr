import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Finish } from "./screens/Finish";
import { ThemeProvider } from "./components/ui/theme-provider";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="smollpng-theme">
      <Finish />
    </ThemeProvider>
  </StrictMode>
);
