import { useEffect } from "react";

function usePreventReload(isActionActive: boolean) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActionActive) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return function () {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isActionActive]);
}

export default usePreventReload;
