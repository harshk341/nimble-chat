import { useState } from "react";
import useSocket from "../hooks/useSocket";
import useAuth from "../hooks/useAuth";
import axios from "axios";
import apiCaller from "../utils/apiCaller";
import type { User } from "../types";
import Loader from "./Loader";
import TimerPopup from "./TimerPopup";

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormError {
  email?: string;
  password?: string;
}

interface ApiResponse {
  success: boolean;
  user: User;
  message: string;
  token: string;
}

const initialFormData = {
  email: "",
  password: "",
};

const LoginForm = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>(initialFormData);
  const [error, setError] = useState<LoginFormError>({});
  const [isLoading, setIsLoading] = useState(false);
  const { initializeSocketAndJoin, showTimerPopup, initializeRandomChat } =
    useSocket();

  const validate = (): boolean => {
    const newErrors: LoginFormError = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    setError(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();

      if (!validate()) return;

      setIsLoading(true);

      const data: ApiResponse = await apiCaller.post("/auth/login", formData);
      apiCaller.defaults.headers.common["Authorization"] =
        `Bearer ${data.token}`;

      login(data.user);
      initializeSocketAndJoin(data.user._id);

      setFormData(initialFormData);
      alert(data.message);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        alert(JSON.stringify(error.response.data));
      } else {
        console.log(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 self-center">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-5 max-w-fit mx-auto shadow p-6 border-slate-300 rounded"
        >
          <h2 className="text-3xl">Login</h2>
          <fieldset className="flex flex-col gap-2 w-full">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              className="px-3 py-2 border bg-slate-100 rounded border-slate-300"
            />
            {error.email && <span className="text-red-600">{error.email}</span>}
          </fieldset>
          <fieldset className="flex flex-col gap-2 w-full">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              className="px-3 py-2 border bg-slate-100 rounded border-slate-300"
            />
            {error.password && (
              <span className="text-red-600">{error.password}</span>
            )}
          </fieldset>
          <fieldset className="flex flex-col w-full">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-slate-600 text-white px-4 py-2 rounded cursor-pointer disabled:cursor-auto disabled:bg-slate-400 hover:bg-slate-500"
            >
              {isLoading ? (
                <Loader classname="w-6 h-6 border-r-3 border-t-3 border-t-white" />
              ) : (
                "Login"
              )}
            </button>
          </fieldset>
          <div className="w-full flex items-center gap-4">
            <hr className="w-full border-slate-400" />
            <span className="text-(--text)/65">or</span>
            <hr className="w-full border-slate-400" />
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={initializeRandomChat}
            className="w-full bg-slate-600 text-white px-4 py-2 rounded cursor-pointer disabled:cursor-auto disabled:bg-slate-400 hover:bg-slate-500"
          >
            Start Text Chat
          </button>
        </form>
      </div>
      {showTimerPopup && <TimerPopup />}
    </>
  );
};

export default LoginForm;
