// import { StrictMode } from "react";
import "./index.css";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import SocketProvider from "./contexts/SocketContext.tsx";
import AuthProvider from "./contexts/AuthContext.tsx";

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <SocketProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </SocketProvider>,
  // </StrictMode>,
);
