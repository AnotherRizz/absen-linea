import { useEffect, useState } from "react";

export default function RealtimeClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center space-y-2">
      <h1 className="text-5xl font-bold text-gray-800 dark:text-gray-50">
        {now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          // second: "2-digit",
          hour12: false,
          timeZone: "Asia/Jakarta",
        })}
      </h1>

      <p className="text-gray-500 dark:text-gray-400 text-sm">
        {now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Asia/Jakarta",
        })}
      </p>
    </div>
  );
}