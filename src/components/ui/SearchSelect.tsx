import { useEffect, useRef, useState } from "react";

interface Option {
  id: string;
  label: string;
}

interface Props {
  label?: string;
  options: Option[];
  value: string | null;
  placeholder?: string;
  onChange: (value: string) => void;
}

export default function SearchSelect({
  label,
  options,
  value,
  placeholder = "Search...",
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      {label && <label className="block mb-1">{label}</label>}

      <input
        type="text"
        value={selected ? selected.label : search}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        className="w-full border rounded px-3 py-2"
      />

      {open && (
        <div className="absolute z-20 w-full bg-white border rounded mt-1 max-h-48 overflow-y-auto shadow">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              Tidak ditemukan
            </div>
          )}

          {filtered.map((opt) => (
            <div
              key={opt.id}
              onClick={() => {
                onChange(opt.id);
                setSearch(opt.label);
                setOpen(false);
              }}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}