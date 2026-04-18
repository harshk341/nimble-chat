import React from "react";
import useAuth from "./hooks/useAuth";
import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";

const App: React.FC = () => {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <LoginForm />;
  }

  return <Dashboard />;
};

export default App;
