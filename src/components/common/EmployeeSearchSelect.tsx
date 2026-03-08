import { useState } from "react";

type Employee = {
  id: string;
  full_name: string;
};

interface Props {
  employees: Employee[];
  value: string;
  onChange: (id: string) => void;
}

export default function EmployeeSearchSelect({
  employees,
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = employees.find((e) => e.id === value);

  const filtered = employees.filter((e) =>
    e.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={open ? search : selected?.full_name || ""}
        placeholder="Search employee..."
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        className="w-full border rounded-lg px-3 py-2"
      />

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white border rounded-lg shadow">
          {filtered.length === 0 && (
            <div className="p-2 text-sm text-gray-400">
              No employee found
            </div>
          )}

          {filtered.map((emp) => (
            <div
              key={emp.id}
              onClick={() => {
                onChange(emp.id);
                setSearch("");
                setOpen(false);
              }}
              className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
            >
              {emp.full_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}