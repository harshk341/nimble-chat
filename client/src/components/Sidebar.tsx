import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import apiCaller from "../utils/apiCaller";
import axios, { AxiosError } from "axios";
import type { User } from "../types";
import Loader from "./Loader";

const Sidebar: React.FC<{
  isOpen: boolean;
  handleClose: () => void;
  handleSelectedUser: (id: string) => void;
  selectedUser: string | null;
}> = ({ isOpen, handleClose, handleSelectedUser, selectedUser }) => {
  const {
    data: users = [],
    error,
    isLoading,
    mutate,
  } = useSWR<User[], AxiosError | Error, string>("/users", (url) =>
    apiCaller.get(url).then((result) => result.data),
  );
  const { user, logout } = useAuth();
  const { onlineUsers, emitDisconnect, socket } = useSocket();
  const [typingUser, setTypingUser] = useState<Set<string>>(new Set([]));
  const typingUserTimeout = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const usersList = useMemo(() => {
    const newOnlineUser = onlineUsers.filter((v) => v !== user?._id);
    return users.map((user) => ({
      ...user,
      isOnline: newOnlineUser.includes(user._id),
    }));
  }, [onlineUsers, user, users]);

  const handleLogout = () => {
    logout();
    emitDisconnect();
  };

  const fetchNewUsers = useCallback(async () => {
    await mutate();
  }, [mutate]);

  useEffect(() => {
    if (!socket) return;

    const currentTimeoutRef = typingUserTimeout.current;

    const handleTypingStatus = (sender: string) => {
      setTypingUser((prev) => new Set(prev).add(sender));

      if (currentTimeoutRef[sender]) {
        clearTimeout(currentTimeoutRef[sender]);
      }

      currentTimeoutRef[sender] = setTimeout(() => {
        setTypingUser((prev) => {
          const newSet = new Set(prev);
          newSet.delete(sender);
          return newSet;
        });
        delete currentTimeoutRef[sender];
      }, 2000);
    };

    socket.on("user-typing", handleTypingStatus);
    socket.on("new-user", fetchNewUsers);

    return function () {
      socket.removeListener("user-typing", handleTypingStatus);
      socket.removeListener("new-user", fetchNewUsers);
      Object.values(currentTimeoutRef).forEach(clearTimeout);
    };
  }, [socket, fetchNewUsers]);

  if (error) {
    if (axios.isAxiosError(error)) {
      return <div>Error: {error.message}</div>;
    } else {
      return <div>Unexpected Error: {error.message}</div>;
    }
  }

  return (
    <>
      <div className="hidden h-full md:basis-1/4 border-r-2 border-r-slate-300 md:flex flex-col">
        <ul className="flex flex-col flex-1 gap-2 mt-3 px-3 overflow-y-auto">
          {isLoading ? (
            <Loader classname="w-10 h-10 border-r-4 border-t-4 border-t-slate-700" />
          ) : (
            usersList.map((user) => (
              <li key={user._id}>
                <button
                  type="button"
                  onClick={() => handleSelectedUser(user._id)}
                  className={`rounded-md p-4 flex w-full cursor-pointer justify-between items-center ${selectedUser === user._id ? "bg-slate-600 text-white" : "bg-slate-200"}`}
                >
                  {user.name}
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${user.isOnline ? "bg-green-400" : "bg-slate-400"}`}
                  ></span>
                  {typingUser.has(user._id) && <span>typing...</span>}
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="py-3 px-2">
          <button
            type="button"
            onClick={handleLogout}
            className="bg-slate-600 p-4 rounded-md text-white w-full cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
          <div className="relative w-full max-w-2xs bg-white h-full shadow flex flex-col">
            <ul className="flex flex-col flex-1 gap-2 mt-3 px-3 overflow-y-auto">
              {isLoading ? (
                <span className="animate-spin w-10 h-10 border-4 border-slate-100 border-t-slate-700 rounded-full inline-block"></span>
              ) : (
                usersList.map((user) => (
                  <li key={user._id}>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectedUser(user._id);
                        handleClose();
                      }}
                      className={`rounded-md p-4 flex w-full cursor-pointer justify-between items-center ${selectedUser === user._id ? "bg-slate-600 text-white" : "bg-slate-200"}`}
                    >
                      {user.name}
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${user.isOnline ? "bg-green-400" : "bg-slate-400"}`}
                      ></span>
                      {typingUser.has(user._id) && <span>typing...</span>}
                    </button>
                  </li>
                ))
              )}
            </ul>
            <div className="py-3 px-2">
              <button
                type="button"
                onClick={handleLogout}
                className="bg-slate-600 p-4 rounded-md text-white w-full cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(Sidebar);
