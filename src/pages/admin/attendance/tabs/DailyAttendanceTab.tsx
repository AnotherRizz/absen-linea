import { useEffect, useState } from "react";
import { supabase } from "../../../../services/supabaseClient";
import {
  formatDate,
  formatTime,
  formatMinutes,
} from "../../../../utils/timeFormatter";
import DatePicker from "../../../../components/form/date-picker";
import AttendanceDetailDialog from "../AttendanceDetailDialog";
import { ScanSearch, Search } from "lucide-react";

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
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari karyawan..."
            className="input-field pl-10 w-64"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>

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
          className="select-field w-auto"
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
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Karyawan</th>
              <th>Jam Masuk</th>
              <th>Jam Pulang</th>
              <th>Durasi</th>
              <th>Detail</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                    Memuat data...
                  </div>
                </td>
              </tr>
            )}

            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 dark:text-gray-500">
                  Tidak ada data absensi
                </td>
              </tr>
            )}

            {data.map((item) => (
              <tr key={item.id}>
                <td>
                  {formatDate(item.attendance_date)}
                </td>

                <td className="font-medium">
                  {item.employees?.full_name || "—"}
                </td>

                <td>{formatTime(item.check_in)}</td>

                <td>{formatTime(item.check_out)}</td>

                <td>
                  {formatMinutes(item.work_minutes)}
                </td>

                <td>
                  <button
                    onClick={() => {
                      setSelectedId(item.id);
                      setOpen(true);
                    }}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25 transition-colors"
                    title="Lihat Detail"
                  >
                    <ScanSearch className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {Math.min((page - 1) * pageSize + 1, total)} –{" "}
          {Math.min(page * pageSize, total)} of {total}
        </div>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="pagination-btn">
            Prev
          </button>

          <span className="pagination-btn pagination-btn-active">
            {page} / {totalPages || 1}
          </span>

          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
            className="pagination-btn">
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
