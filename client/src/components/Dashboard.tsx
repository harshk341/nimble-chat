import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import { AxiosError } from "axios";
import apiCaller from "../utils/apiCaller";
import Sidebar from "./Sidebar";

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
}

const Dashboard = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const {
    data: messages = [],
    error,
    isLoading,
    mutate,
  } = useSWR<Message[], AxiosError | Error, string | null>(
    selectedUser ? `/messages/${selectedUser}` : null,
    (url) => apiCaller.get(url).then((result) => result.data),
  );
  const { user } = useAuth();
  const { socket } = useSocket();
  const [inputValue, setInputValue] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const msgRef = useRef<HTMLUListElement>(null);

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

    const handleReceiveMessage = (msg: Message) => {
      const isCurrentChat =
        (msg.sender === user._id && msg.receiver === selectedUser) ||
        (msg.sender === selectedUser && msg.receiver === user._id);
      if (!isCurrentChat) return;

      mutate((prevMessages = []) => {
        return [...prevMessages, msg];
      }, false);
    };

    socket.on("receiver-message", handleReceiveMessage);

    return function () {
      socket.removeListener("receiver-message", handleReceiveMessage);
    };
  }, [socket, selectedUser, user, mutate]);

  useEffect(() => {
    const ele = msgRef.current;
    if (ele) {
      ele.scrollTo({ top: ele.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  if (error) {
    if (error instanceof AxiosError) {
      return <div>Error: {error.message}</div>;
    } else {
      return <div>Unexpected Error: {error.message}</div>;
    }
  }

  return (
    <div className="flex justify-center items-center w-full flex-1">
      <Sidebar
        isOpen={isOpen}
        handleClose={() => {
          setIsOpen(false);
        }}
        handleSelectedUser={(id: string) => {
          setSelectedUser(id);
        }}
        selectedUser={selectedUser}
      />
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
        <ul
          ref={msgRef}
          className="flex-1 p-4 overflow-y-auto flex flex-col gap-0.5"
        >
          {isLoading ? (
            <span className="animate-spin w-10 h-10 border-4 border-slate-100 border-t-slate-700 rounded-full inline-block"></span>
          ) : (
            messages.map((msg) => {
              const isSender = msg.sender === user?._id;

              return (
                <li
                  key={msg._id}
                  className={`${isSender ? "bg-slate-200 self-end" : "bg-slate-600 self-start text-white"} p-2 rounded-md max-w-3/4`}
                >
                  {msg.content}
                </li>
              );
            })
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
