import { useEffect, useState } from "react";

export default function RealtimeClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  });

  const [hours, minutes] = timeStr.split(".");

  return (
    <div className="text-center space-y-3 py-4">
      <h1 className="text-6xl font-bold tracking-tight text-gray-800 dark:text-gray-50">
        <span>{hours}</span>
        <span className="text-brand-500 animate-pulse mx-1">:</span>
        <span>{minutes}</span>
      </h1>

      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
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