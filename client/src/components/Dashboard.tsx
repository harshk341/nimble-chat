import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import axios from "axios";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { onlineUsers, emitDisconnect, socket } = useSocket();
  const [inputValue, setInputValue] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [typingUser, setTypingUser] = useState<Set<string>>(new Set([]));
  const typingUserTimeput = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const usersList = useMemo(() => {
    const newOnlineUser = onlineUsers.filter((v) => v !== user?._id);
    return users.map((user) => ({
      ...user,
      isOnline: newOnlineUser.includes(user._id),
    }));
  }, [onlineUsers, user, users]);

  const fetchUsersList = useCallback(async () => {
    setLoadingUser(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_API}/users`,
      );

      setUsers(data.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        alert(JSON.stringify(error.response.data));
      } else {
        console.log(error);
      }
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const handleLogout = () => {
    logout();
    emitDisconnect();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setInputValue(value);
  };

  const handleKeyDown = () => {
    if (!socket || !user || !selectedUser) return;

    socket.emit("typing", {
      sender: user._id,
      receiver: selectedUser,
    });
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (!value || !selectedUser || !user || !socket) return;

    setInputValue("");

    socket.emit("send-message", {
      sender: user._id,
      receiver: selectedUser,
      content: value,
    });
  };

  useEffect(() => {
    if (!socket || !user || !selectedUser) return;

    const currentTimeoutRef = typingUserTimeput.current;

    const handleReceiveMessage = (msg: any) => {
      const isCurrentChat =
        (msg.sender === user._id && msg.receiver === selectedUser) ||
        (msg.sender === selectedUser && msg.receiver === user._id);
      if (!isCurrentChat) return;
      setMessages((prev: any[]) => {
        return [...prev, msg];
      });
    };

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

    socket.on("receiver-message", handleReceiveMessage);
    socket.on("user-typing", handleTypingStatus);
    socket.on("new-user", fetchUsersList);

    return function () {
      socket.removeListener("receiver-message", handleReceiveMessage);
      socket.removeListener("user-typing", handleTypingStatus);
      socket.removeListener("new-user", fetchUsersList);
      Object.values(currentTimeoutRef).forEach(clearTimeout);
    };
  }, [socket, selectedUser, user, fetchUsersList]);

  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessageList = async () => {
      setLoadingMsg(true);
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_API}/messages/${selectedUser}`,
        );

        setMessages(data.data);
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response) {
          alert(JSON.stringify(error.response.data));
        } else {
          console.log(error);
        }
      } finally {
        setLoadingMsg(false);
      }
    };

    fetchMessageList();
  }, [selectedUser]);

  useEffect(() => {
    const loadUsers = async () => {
      await fetchUsersList();
    };

    loadUsers();
  }, [fetchUsersList]);

  return (
    <div className="flex justify-center items-center w-full flex-1">
      <div className="hidden h-full md:basis-1/4 border-r-2 border-r-slate-300 md:flex flex-col">
        <ul className="flex flex-col flex-1 gap-2 mt-3 px-3 overflow-y-auto">
          {loadingUser ? (
            <span className="animate-spin w-10 h-10 border-4 border-slate-100 border-t-slate-700 rounded-full inline-block"></span>
          ) : (
            usersList.map((user) => (
              <li key={user._id}>
                <button
                  type="button"
                  onClick={() => setSelectedUser(user._id)}
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
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setIsOpen(false);
            }}
          />
          <div className="relative w-full max-w-2xs bg-white h-full shadow flex flex-col">
            <ul className="flex flex-col flex-1 gap-2 mt-3 px-3 overflow-y-auto">
              {loadingUser ? (
                <span className="animate-spin w-10 h-10 border-4 border-slate-100 border-t-slate-700 rounded-full inline-block"></span>
              ) : (
                usersList.map((user) => (
                  <li key={user._id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(user._id);
                        setIsOpen(false);
                      }}
                      className={`rounded-md p-4 flex w-full cursor-pointer justify-between items-center ${selectedUser === user._id ? "bg-slate-600 text-white" : "bg-slate-200"}`}
                    >
                      {user.name}
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${user.isOnline ? "bg-green-400" : "bg-slate-400"}`}
                      ></span>
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
      <div className="flex flex-col h-full basis-full md:basis-3/4">
        <div className="shadow p-4 md:hidden">
          <button
            className="flex flex-col gap-1 p-2 rounded-md cursor-pointer hover:bg-slate-100 w-10 h-10 justify-center"
            type="button"
            onClick={() => {
              setIsOpen(true);
            }}
          >
            <span className="inline-block w-full h-1 rounded-lg bg-(--text)"></span>
            <span className="inline-block w-2/3 h-1 rounded-lg bg-(--text)"></span>
          </button>
        </div>
        <ul className="flex-1 p-4 overflow-y-auto space-y-2">
          {loadingMsg ? (
            <span className="animate-spin w-10 h-10 border-4 border-slate-100 border-t-slate-700 rounded-full inline-block"></span>
          ) : (
            messages.map((msg) => (
              <li>
                {`${msg.sender === user?._id ? "You" : "Friend"} :- ${msg.content}`}
              </li>
            ))
          )}
        </ul>
        <form
          onSubmit={handleSubmit}
          className="flex items-center w-full px-2 py-3 gap-2"
        >
          <input
            type="text"
            autoComplete="off"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            value={inputValue}
            placeholder="Type a message"
            className="flex-1 px-3 py-4 bg-slate-200 rounded border-slate-300"
          />
          <button
            type="submit"
            className="bg-slate-600 text-white p-4 rounded cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
