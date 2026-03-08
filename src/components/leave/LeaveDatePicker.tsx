import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { differenceInCalendarDays, format } from "date-fns";
import "react-day-picker/dist/style.css";

interface Props {
  start: string;
  end: string;
  onChange: (start: string, end: string, total: number) => void;
}

export default function LeaveDatePicker({ start, end, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<any>();
  const ref = useRef<any>(null);

  useEffect(() => {
    if (range?.from && range?.to) {
      const startDate = format(range.from, "yyyy-MM-dd");
      const endDate = format(range.to, "yyyy-MM-dd");

      const total =
        differenceInCalendarDays(range.to, range.from) + 1;

      onChange(startDate, endDate, total);

      // close hanya jika end date sudah dipilih
      setTimeout(() => setOpen(false), 200);
    }
  }, [range]);

  useEffect(() => {
    function handleClick(e: any) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayValue =
    start && end
      ? `${format(new Date(start), "dd MMM yyyy")} - ${format(
          new Date(end),
          "dd MMM yyyy"
        )}`
      : start
      ? `${format(new Date(start), "dd MMM yyyy")} - ...`
      : "";

  return (
    <div className="relative w-full max-w-sm" ref={ref}>
      
      {/* Input */}
      <div
        onClick={() => setOpen(!open)}
        className="w-full border rounded-lg px-3 py-2 cursor-pointer bg-white flex items-center justify-between hover:border-gray-400"
      >
        <span className="text-sm text-gray-700">
          {displayValue || "Pilih tanggal cuti"}
        </span>

        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10m-13 9h16a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z"
          />
        </svg>
      </div>

      {/* Calendar */}
      {open && (
        <div className="absolute z-50 mt-2 bg-white border rounded-xl shadow-lg p-3">

          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            disabled={{ before: new Date() }}
            numberOfMonths={1}
            className="text-sm"
          />

        </div>
      )}
    </div>
  );
}