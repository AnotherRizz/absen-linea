import { useEffect, useState } from "react";
import { supabase } from "../../../../services/supabaseClient";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
}

interface Attendance {
  attendance_date: string;
  photo: string | null;
  name: string;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function CalendarAttendanceTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [attendance, setAttendance] = useState<Record<string, Attendance>>({});

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, full_name")
      .eq("is_active", true);

    setEmployees(data || []);
  };

  const fetchAttendance = async () => {
    if (!employeeId) return;

    const daysInMonth = new Date(year, month, 0).getDate();
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const { data } = await supabase
      .from("attendance_records")
      .select(`
        attendance_date,
        attachment,
        employee:employees!attendance_records_employee_id_fkey(full_name)
      `)
      .eq("employee_id", employeeId)
      .gte("attendance_date", start)
      .lte("attendance_date", end);

    const mapped: Record<string, Attendance> = {};

    (data || []).forEach((item: any) => {
      const photoUrl = item.attachment
        ? supabase.storage
            .from("attendance-photos")
            .getPublicUrl(item.attachment).data.publicUrl
        : null;

      mapped[item.attendance_date] = {
        attendance_date: item.attendance_date,
        photo: photoUrl,
        name: item.employee?.full_name,
      };
    });

    setAttendance(mapped);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [employeeId, month, year]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sunday

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const formatDate = (day: number) => {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const isWeekend = (day: number) => {
    const d = new Date(year, month - 1, day).getDay();
    return d === 0 || d === 6;
  };

  const isToday = (day: number) => {
    const now = new Date();
    return day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
  };

  const totalPresent = Object.keys(attendance).length;
  const totalDays = daysInMonth;

  return (
    <div className="space-y-6">
      {/* FILTER */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Karyawan
          </label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="select-field w-auto min-w-[200px]"
          >
            <option value="">Pilih Karyawan</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Month/Year nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CalendarDays className="w-4 h-4 text-brand-500" />
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm min-w-[140px] text-center">
              {MONTH_NAMES[month - 1]} {year}
            </span>
          </div>

          <button
            onClick={nextMonth}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Summary Badge */}
        {employeeId && (
          <div className="ml-auto">
            <span className="badge badge-info">
              {totalPresent} / {totalDays} hari hadir
            </span>
          </div>
        )}
      </div>

      {!employeeId ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 p-6">
            <CalendarDays className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Pilih Karyawan
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
            Pilih karyawan terlebih dahulu untuk melihat kalender absensi.
          </p>
        </div>
      ) : (
        <>
          {/* CALENDAR GRID */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800/50">
              {DAY_NAMES.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-3 border-b border-gray-200 dark:border-gray-700"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7">
              {/* Empty cells for offset */}
              {Array.from({ length: firstDayOfWeek }, (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="h-28 sm:h-36 border-b border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30"
                />
              ))}

              {days.map((day) => {
                const date = formatDate(day);
                const record = attendance[date];
                const weekend = isWeekend(day);
                const today = isToday(day);

                return (
                  <div
                    key={day}
                    className={`relative h-28 sm:h-36 border-b border-r border-gray-100 dark:border-gray-800 overflow-hidden group transition-colors ${
                      weekend
                        ? "bg-orange-50/50 dark:bg-orange-500/5"
                        : "bg-white dark:bg-gray-900"
                    }`}
                  >
                    {/* Date number */}
                    <div className={`absolute top-1.5 left-2 z-10 text-xs font-bold ${
                      today
                        ? "bg-brand-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        : weekend
                          ? "text-orange-500 dark:text-orange-400"
                          : "text-gray-700 dark:text-gray-300"
                    }`}>
                      {day}
                    </div>

                    {/* Attendance indicator */}
                    {record?.photo ? (
                      <img
                        src={record.photo}
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        alt={`Absen ${day}`}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full pt-4">
                        {record ? (
                          <span className="text-[10px] text-success-500 font-medium">✓ Hadir</span>
                        ) : (
                          <span className="text-[10px] text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </div>
                    )}

                    {/* Presence badge overlay */}
                    {record && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
                        <span className="text-[9px] text-white font-medium truncate block">
                          ✓ Hadir
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700" />
              <span>Hari Kerja</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30" />
              <span>Sabtu / Minggu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-brand-500" />
              <span>Hari Ini</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}