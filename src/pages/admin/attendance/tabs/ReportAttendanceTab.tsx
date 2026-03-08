import { useState, useEffect } from "react";
import { supabase } from "../../../../services/supabaseClient";
import DatePicker from "../../../../components/form/date-picker";
import { formatDate, formatTime } from "../../../../utils/timeFormatter";
import { exportAttendanceExcel } from "../../../../utils/exportAttendanceExcel";

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
  //   const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeId, _setEmployeeId] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const [data, setData] = useState<ReportRow[]>([]);
  //   const [loading, setLoading] = useState(false);

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
  function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
      Masuk: "bg-green-100 text-green-700",
      Absen: "bg-red-100 text-red-700",
      late: "bg-yellow-100 text-yellow-700",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
          styles[status] || "bg-gray-100 text-gray-700"
        }`}>
        {status}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end">
        <div className="flex gap-4 items-end">
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

          {/* Search Employee */}
          {/* <input
            type="text"
            placeholder="Cari employee..."
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          /> */}

          {/* Generate */}
          <button
            onClick={generateReport}
            className="bg-black text-white flex items-center gap-2 px-4 py-2 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            Generate Report
          </button>
        </div>

        {data.length > 0 && (
          <button
            onClick={() => exportAttendanceExcel(data, dateRange)}
            className="bg-green-500 text-white flex gap-2 items-center px-4 py-2 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
              />
            </svg>
            Export Excel
          </button>
        )}
      </div>
      {generating && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-20 text-blue-500 animate-pulse">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"
            />
          </svg>

          <p className="text-gray-500 text-sm">Generating report...</p>
        </div>
      )}
      {!generating && data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="mb-4 rounded-full bg-gray-100 p-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17v-6m3 6v-4m3 4v-2M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-700">
            Laporan Absensi Belum Dibuat
          </h3>

          <p className="text-sm text-gray-500 mt-2 max-w-md">
            Pilih range tanggal terlebih dahulu lalu klik
            <span className="font-medium text-gray-700"> Generate Report </span>
            untuk menampilkan laporan absensi karyawan.
          </p>
        </div>
      )}
      {!generating && data.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-500">Total Employee</p>
              <p className="text-xl font-semibold">{stats.totalEmployees}</p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-500">Hadir</p>
              <p className="text-xl font-semibold text-green-600">
                {stats.present}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-500">Tidak Hadir</p>
              <p className="text-xl font-semibold text-red-600">
                {stats.absent}
              </p>
            </div>
          </div>
          {data.length > 0 && dateRange.length === 2 && (
            <div className="text-sm text-gray-600">
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

          <div className="overflow-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Nama Karyawan</th>
                  <th className="px-4 py-3">Absen Masuk</th>
                  <th className="px-4 py-3">Absen Pulang</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-t text-center">
                    <td className="px-4 py-3">{formatDate(row.date)}</td>

                    <td className="px-4 py-3">{row.employee}</td>

                    <td className="px-4 py-3">
                      {row.check_in ? formatTime(row.check_in) : "-"}
                    </td>

                    <td className="px-4 py-3">
                      {row.check_in ? formatTime(row.check_out) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={row.status === "present" ? "Masuk" : "Absen"}
                      />
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
