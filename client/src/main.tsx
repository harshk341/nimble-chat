// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
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
