import React, { createContext, useReducer } from "react";

type User = Record<string, any>;

const initialState: {
  isLoggedIn: boolean;
  user: User | null;
} = {
  isLoggedIn: false,
  user: null,
};

export const AuthContext = createContext({
  ...initialState,
  login: (_user: User) => Promise.resolve(),
  logout: () => Promise.resolve(),
});

type Action = { type: "LOGIN"; payload: { user: User } } | { type: "LOGOUT" };

const reducer = (state: typeof initialState, action: Action) => {
  switch (action.type) {
    case "LOGIN":
      return { ...state, isLoggedIn: true, user: action.payload.user };
    case "LOGOUT":
      return { ...state, isLoggedIn: false, user: null };
    default:
      throw new Error("Unhandled action type");
  }
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = async (user: User) => {
    dispatch({
      type: "LOGIN",
      payload: { user },
    });
  };

  const logout = async () => {
    dispatch({ type: "LOGOUT" });
  };
  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
