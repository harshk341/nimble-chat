import React from "react";
import useAuth from "./hooks/useAuth";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";
import useSocket from "./hooks/useSocket";
import RandomChat from "./components/RandomChat";

const App: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const { roomId } = useSocket();

  if (roomId) {
    return <RandomChat />;
  }

  if (!isLoggedIn) {
    return <LoginForm />;
  }

  return <Dashboard />;
};

export default App;
