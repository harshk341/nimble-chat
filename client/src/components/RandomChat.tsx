import { useEffect, useRef, useState } from "react";
import useSocket from "../hooks/useSocket";
import usePreventReload from "../hooks/usePreventReload";

const RandomChat = () => {
  const { socket, roomId, disconnectRandomChat } = useSocket();
  const [inputValue, setInputValue] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const msgRef = useRef<HTMLUListElement>(null);
  const [confirm, setConfirm] = useState(false);
  const [partnerDisconnect, setPartnerDisconnect] = useState(false);
  usePreventReload(!!socket?.connected || !!roomId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setInputValue(value);
  };

  const handleKeyDown = () => {
    if (!socket || !roomId) return;
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (!value || !roomId || !socket) return;

    setInputValue("");
    setConfirm(false);

    socket.emit("send-message", {
      content: value,
      roomId,
      sender: socket.id,
    });
  };

  const handleDisconnect = () => {
    if (confirm) {
      disconnectRandomChat();
    } else {
      setConfirm(true);
    }
  };

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleReceiveMessage = (msg: any) => {
      setMessages((prevMessages) => {
        return [...prevMessages, msg];
      });
    };

    const handlePartnerDisconnect = () => {
      setPartnerDisconnect(true);
    };

    socket.on("receive-message", handleReceiveMessage);

    socket.on("partner-disconnected", handlePartnerDisconnect);

    return function () {
      socket.removeListener("receive-message", handleReceiveMessage);
      socket.removeListener("partner-disconnected", handlePartnerDisconnect);
    };
  }, [socket, roomId]);

  useEffect(() => {
    const ele = msgRef.current;
    if (ele) {
      ele.scrollTo({ top: ele.scrollHeight, behavior: "instant" });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full w-full">
      <ul
        ref={msgRef}
        className="flex-1 p-4 overflow-y-auto flex flex-col gap-0.5"
      >
        {messages.map((msg) => {
          const isSender = msg.sender === socket?.id;
          return (
            <li
              key={msg.id}
              className={`${isSender ? "bg-slate-200 self-end" : "bg-slate-600 self-start text-white"} p-2 rounded-md max-w-3/4`}
            >
              {msg.content}
            </li>
          );
        })}
      </ul>
      <div className="flex items-center w-full p-2 gap-2">
        <button
          type="button"
          className={`${confirm && socket ? "bg-red-600" : "bg-slate-600"} text-white p-3 rounded cursor-pointer`}
          onClick={handleDisconnect}
        >
          {confirm ? "Confirm?" : "Exit"}
        </button>
        {partnerDisconnect ? (
          <p className="w-full bg-slate-300 p-3 rounded text-nowrap text-ellipsis overflow-hidden">
            Your partner has been disconnected.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex items-center w-full gap-2"
          >
            <input
              type="text"
              autoComplete="off"
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              value={inputValue}
              placeholder="Type a message"
              className="px-1.5 py-3 bg-slate-200 rounded border-slate-300 w-full"
            />
            <button
              type="submit"
              className="bg-slate-600 text-white p-3 rounded cursor-pointer"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RandomChat;
