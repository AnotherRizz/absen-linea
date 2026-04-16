import { useState, useEffect } from "react";
import { supabase } from "../../../../services/supabaseClient";
import DatePicker from "../../../../components/form/date-picker";
import { formatDate, formatTime } from "../../../../utils/timeFormatter";
import { exportAttendanceExcel } from "../../../../utils/exportAttendanceExcel";
import { FileText, Download, Users, CheckCircle, XCircle } from "lucide-react";

interface ReportRow {
  date: string;
  employee: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  work_minutes: number | null;
  late_minutes: number | null;
}

export default function ReportAttendanceTab() {
  const [dateRange, setDateRange] = useState<string[]>([]);
  const [_employees, setEmployees] = useState<any[]>([]);
  const [employeeId] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const [data, setData] = useState<ReportRow[]>([]);

  const [stats, setStats] = useState({
    totalEmployees: 0,
    present: 0,
    absent: 0,
  });

  const generateDates = (start: string, end: string) => {
    const dates: string[] = [];
    const current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");

      dates.push(`${y}-${m}-${d}`);

      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const generateReport = async () => {
    if (dateRange.length < 2) return;

    setGenerating(true);
    setData([]);

    const start = dateRange[0];
    const end = dateRange[1];

    const dates = generateDates(start, end);

    const employeesQuery = supabase.from("employees").select("id, full_name");

    if (employeeId) employeesQuery.eq("id", employeeId);

    const { data: employees } = await employeesQuery;

    const { data: attendance } = await supabase
      .from("attendance_records")
      .select(
        `
      employee_id,
      attendance_date,
      check_in,
      check_out,
      work_minutes,
      late_minutes
    `,
      )
      .gte("attendance_date", start)
      .lte("attendance_date", end);

    const map = new Map();

    attendance?.forEach((a) => {
      map.set(`${a.employee_id}_${a.attendance_date}`, a);
    });

    const rows: ReportRow[] = [];

    let present = 0;
    let absent = 0;

    employees?.forEach((emp) => {
      dates.forEach((date) => {
        const key = `${emp.id}_${date}`;
        const record = map.get(key);

        if (record) {
          present++;

          rows.push({
            date,
            employee: emp.full_name,
            status: "present",
            check_in: record.check_in,
            check_out: record.check_out,
            work_minutes: record.work_minutes,
            late_minutes: record.late_minutes,
          });
        } else {
          absent++;

          rows.push({
            date,
            employee: emp.full_name,
            status: "absent",
            check_in: null,
            check_out: null,
            work_minutes: null,
            late_minutes: null,
          });
        }
      });
    });

    setStats({
      totalEmployees: employees?.length || 0,
      present,
      absent,
    });

    // delay animasi
    setTimeout(() => {
      setData(rows);
      setGenerating(false);
    }, 2000);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, full_name")
      .order("full_name");

    setEmployees(data || []);
  };
  useEffect(() => {
    fetchEmployees();
  }, []);
  function formatReportDate(date: string) {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Date Range */}
          <DatePicker
            id="report-date"
            mode="range"
            placeholder="Pilih range tanggal"
            onChange={(dates: any[]) => {
              if (dates.length === 2) {
                const format = (d: Date) =>
                  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
                    2,
                    "0",
                  )}-${String(d.getDate()).padStart(2, "0")}`;

                setDateRange([format(dates[0]), format(dates[1])]);
              }
            }}
          />

          {/* Generate */}
          <button
            onClick={generateReport}
            className="btn-primary">
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
        </div>

        {data.length > 0 && (
          <button
            onClick={() => exportAttendanceExcel(data, dateRange)}
            className="btn-success">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        )}
      </div>
      {generating && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Generating report...</p>
        </div>
      )}
      {!generating && data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 p-6">
            <FileText className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>

          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Laporan Absensi Belum Dibuat
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
            Pilih range tanggal terlebih dahulu lalu klik
            <span className="font-medium text-gray-700 dark:text-gray-300"> Generate Report </span>
            untuk menampilkan laporan absensi karyawan.
          </p>
        </div>
      )}
      {!generating && data.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card !p-5 group">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-500/15 transition-transform duration-300 group-hover:scale-110">
                  <Users className="text-brand-500 w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Employee</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{stats.totalEmployees}</p>
                </div>
              </div>
            </div>

            <div className="stat-card !p-5 group">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-success-50 dark:bg-success-500/15 transition-transform duration-300 group-hover:scale-110">
                  <CheckCircle className="text-success-500 w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Hadir</p>
                  <p className="text-xl font-bold text-success-600 dark:text-success-400">
                    {stats.present}
                  </p>
                </div>
              </div>
            </div>

            <div className="stat-card !p-5 group">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-error-50 dark:bg-error-500/15 transition-transform duration-300 group-hover:scale-110">
                  <XCircle className="text-error-500 w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tidak Hadir</p>
                  <p className="text-xl font-bold text-error-600 dark:text-error-400">
                    {stats.absent}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {data.length > 0 && dateRange.length === 2 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Hasil report dari{" "}
              <span className="font-semibold">
                {formatReportDate(dateRange[0])}
              </span>{" "}
              sampai{" "}
              <span className="font-semibold">
                {formatReportDate(dateRange[1])}
              </span>
            </div>
          )}

          <div className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Karyawan</th>
                  <th>Absen Masuk</th>
                  <th>Absen Pulang</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    <td>{formatDate(row.date)}</td>

                    <td className="font-medium">{row.employee}</td>

                    <td>
                      {row.check_in ? formatTime(row.check_in) : "—"}
                    </td>

                    <td>
                      {row.check_out ? formatTime(row.check_out) : "—"}
                    </td>
                    <td>
                      <span className={`badge ${row.status === "present" ? "badge-success" : "badge-danger"}`}>
                        {row.status === "present" ? "Masuk" : "Absen"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
