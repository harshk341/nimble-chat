import { useEffect, useState } from "react";
import Loader from "./Loader";
import useSocket from "../hooks/useSocket";
import usePreventReload from "../hooks/usePreventReload";

type Status = "SEARCHING" | "NOT_FOUND";

const TimerPopup = () => {
  const [seconds, setSeconds] = useState(59);
  const [status, setStatus] = useState<Status>("SEARCHING");
  const { closeTimerPopup, socket } = useSocket();
  usePreventReload(!!socket?.connected);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSeconds((prevSeconds) => {
        if (prevSeconds <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prevSeconds - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const check = () => {
      if (seconds === 0 && status === "SEARCHING") {
        setStatus("NOT_FOUND");
        socket?.disconnect();
      }
    };
    check();
  }, [seconds, status, socket]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative max-w-xs w-full bg-white text-center rounded p-4 space-y-4">
        {status === "SEARCHING" ? (
          <>
            <Loader classname="w-10 h-10 border-r-4 border-t-4 border-t-slate-700" />
            <p>Finding user...</p>
            <p>{String(seconds).padStart(2, "0")}s</p>
          </>
        ) : (
          <>
            <p>No user found</p>
          </>
        )}
        <button
          type="button"
          className="bg-slate-600 text-white px-2 py-1 rounded cursor-pointer disabled:cursor-auto disabled:bg-slate-400 hover:bg-slate-500"
          onClick={closeTimerPopup}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default TimerPopup;
