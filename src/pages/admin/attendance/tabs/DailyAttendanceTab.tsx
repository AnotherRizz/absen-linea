import { useEffect, useState } from "react";
import { supabase } from "../../../../services/supabaseClient";
import {
  formatDate,
  formatTime,
  formatMinutes,
} from "../../../../utils/timeFormatter";
import DatePicker from "../../../../components/form/date-picker";
import AttendanceDetailDialog from "../AttendanceDetailDialog";
import { ScanSearch } from "lucide-react";

interface Attendance {
  id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  late_minutes: number;
  work_minutes: number;
  employees: {
    full_name: string;
  } | null;
}
function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function DailyAttendanceTab() {
  const [data, setData] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [date, setDate] = useState(getToday());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("attendance_records")
      .select(
        `
    id,
    attendance_date,
    check_in,
    check_out,
    status,
    late_minutes,
    work_minutes,
    employees:employee_id (
      full_name
    )
  `,
        { count: "exact" },
      )
      .order("attendance_date", { ascending: false })
      .range(from, to);

    if (date) {
      query = query.eq("attendance_date", date);
    }

    if (search) {
      query = query.ilike("employees.full_name", `%${search}%`);
    }

    const { data, error, count } = await query;

    if (!error) {
      const formatted = (data ?? []).map((item: any) => ({
        ...item,
        employees: item.employees ?? null,
      }));

      setData(formatted);

      setTotal(count || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendance();
  }, [page, pageSize, search, date]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Cari karyawan..."
          className="border rounded-lg px-3 py-2 text-sm"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />

        <DatePicker
          id="attendance-date"
          placeholder="Pilih tanggal"
          defaultDate={date ? new Date(date) : undefined}
          onChange={(selectedDates) => {
            setPage(1);
            if (selectedDates.length > 0) {
              const d = selectedDates[0];
              const formatted = `${d.getFullYear()}-${String(
                d.getMonth() + 1,
              ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              setDate(formatted);
            }
          }}
        />

        <select
          className="border rounded-lg px-3 py-2 text-sm"
          value={pageSize}
          onChange={(e) => {
            setPage(1);
            setPageSize(Number(e.target.value));
          }}>
          <option value={10}>10 baris</option>
          <option value={25}>25 baris</option>
          <option value={50}>50 baris</option>
          <option value={100}>100 baris</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Karyawan</th>
              <th className="px-4 py-3">Jam Masuk</th>
              <th className="px-4 py-3">Jam Pulang</th>
              <th className="px-4 py-3">Durasi</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  Tidak ada data absensi
                </td>
              </tr>
            )}

            {data.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">
                  {formatDate(item.attendance_date)}
                </td>

                <td className="px-4 py-3">
                  {item.employees?.full_name || "-"}
                </td>

                <td className="px-4 py-3">{formatTime(item.check_in)}</td>

                <td className="px-4 py-3">{formatTime(item.check_out)}</td>

                <td className="px-4 py-3">
                  {formatMinutes(item.work_minutes)}
                </td>

                <td className="px-4 py-3 capitalize">
                  <button
                    onClick={() => {
                      setSelectedId(item.id);
                      setOpen(true);
                    }}
                    className="text-blue-600">
                    <ScanSearch />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {(page - 1) * pageSize + 1} -
          {Math.min(page * pageSize, total)} of {total}
        </div>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded">
            Prev
          </button>

          <span className="px-2 text-sm">
            {page} / {totalPages || 1}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded">
            Next
          </button>
        </div>
      </div>
      <AttendanceDetailDialog
        attendanceId={selectedId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
