import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/authcontext";
import "./styles/global.css";
import App from "./App";

// Amber orb — sits outside #root so it bleeds through all glass panels
const orbAmber = document.createElement("div");
orbAmber.className = "orb-amber";
document.body.appendChild(orbAmber);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);