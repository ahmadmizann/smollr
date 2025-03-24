import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Finish } from "./screens/Finish";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <Finish />
  </StrictMode>,
);
