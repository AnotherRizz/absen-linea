import { useEffect, useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { supabase } from "../../../services/supabaseClient";
import { useDialog } from "../../../components/ui/AppDialog";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  PlayCircle,
  Eye,
  Banknote,
  Users,
  TrendingUp,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface PayrollBatch {
  id: string;
  month: number;
  year: number;
  total_employees: number;
  total_salary: number;
  generated_at: string;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

const getMonthName = (month: number) =>
  new Date(2000, month - 1).toLocaleString("id-ID", { month: "long" });

export default function PayrollManagementPage() {
  const { showDialog, showConfirm } = useDialog();

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Summary stats
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [currentBatch, setCurrentBatch] = useState<PayrollBatch | null>(null);

  const fetchBatches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payroll_batches")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (!error) {
      const mapped: PayrollBatch[] = (data || []).map((b: any) => ({
        id: b.id,
        month: b.month,
        year: b.year,
        total_employees: b.total_employees || 0,
        total_salary: b.total_salary || 0,
        generated_at: b.generated_at,
      }));
      setBatches(mapped);

      // Find current month batch
      const now = new Date();
      const cur = mapped.find(
        (b) => b.month === now.getMonth() + 1 && b.year === now.getFullYear()
      );
      setCurrentBatch(cur || null);
    }
    setLoading(false);
  };

  const fetchEmployeeCount = async () => {
    const { count } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);
    setTotalEmployees(count || 0);
  };

  useEffect(() => {
    fetchBatches();
    fetchEmployeeCount();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);

      // Check if batch already exists
      const { data: existing } = await supabase
        .from("payroll_batches")
        .select("id")
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      if (existing) {
        showDialog(
          `Payroll ${getMonthName(month)} ${year} sudah pernah dibuat. Hapus batch lama jika ingin generate ulang.`,
          "warning"
        );
        return;
      }

      // 1. Get active employees
      const { data: employees } = await supabase
        .from("employees")
        .select(
          "id, basic_salary, daily_meal_allowance, daily_fuel_allowance, other_allowance"
        )
        .eq("is_active", true);

      if (!employees || employees.length === 0) {
        showDialog("Tidak ada karyawan aktif", "error");
        return;
      }

      // 2. Date range
      const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).toISOString().split("T")[0];

      // 3. Attendance
      const { data: attendance } = await supabase
        .from("attendance_records")
        .select("employee_id, attendance_date")
        .gte("attendance_date", firstDay)
        .lte("attendance_date", lastDay);

      const attendanceMap: Record<string, number> = {};
      (attendance || []).forEach((a) => {
        attendanceMap[a.employee_id] =
          (attendanceMap[a.employee_id] || 0) + 1;
      });

      // 4. Approved leaves
      const { data: leaves } = await supabase
        .from("leave_requests")
        .select("employee_id, start_date, end_date")
        .eq("status", "approved")
        .gte("end_date", firstDay)
        .lte("start_date", lastDay);

      const leaveMap: Record<string, number> = {};
      (leaves || []).forEach((l) => {
        const start = new Date(
          Math.max(new Date(l.start_date).getTime(), new Date(firstDay).getTime())
        );
        const end = new Date(
          Math.min(new Date(l.end_date).getTime(), new Date(lastDay).getTime())
        );
        const days =
          Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        leaveMap[l.employee_id] = (leaveMap[l.employee_id] || 0) + days;
      });

      // 5. Total hari dalam bulan (calendar days)
      const totalDaysInMonth = new Date(year, month, 0).getDate();

      // 6. Build payroll rows — tanpa potongan
      let batchTotalSalary = 0;

      const payrollRows = employees.map((emp) => {
        const workDays = attendanceMap[emp.id] || 0;
        const leaveDays = leaveMap[emp.id] || 0;
        const absentDays = Math.max(0, totalDaysInMonth - workDays - leaveDays);

        const meal = workDays * (emp.daily_meal_allowance || 0);
        const fuel = workDays * (emp.daily_fuel_allowance || 0);
        const other = emp.other_allowance || 0;

        // Total gaji = gaji pokok + semua tunjangan (tanpa potongan)
        const net = (emp.basic_salary || 0) + meal + fuel + other;

        batchTotalSalary += net;

        return {
          employee_id: emp.id,
          total_work_days: workDays,
          total_leave_days: leaveDays,
          total_absent_days: absentDays,
          basic_salary: emp.basic_salary || 0,
          total_meal_allowance: meal,
          total_fuel_allowance: fuel,
          other_allowance: other,
          total_deduction: 0,
          net_salary: Math.round(net * 100) / 100,
        };
      });

      // 7. Create batch
      const { data: batch, error: batchError } = await supabase
        .from("payroll_batches")
        .insert({
          month,
          year,
          total_employees: employees.length,
          total_salary: Math.round(batchTotalSalary * 100) / 100,
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // 8. Insert payrolls with batch id
      const withBatchId = payrollRows.map((row) => ({
        ...row,
        payroll_batch_id: batch.id,
      }));

      const { error: insertError } = await supabase
        .from("payrolls")
        .insert(withBatchId);

      if (insertError) throw insertError;

      showDialog(
        `Payroll ${getMonthName(month)} ${year} berhasil dibuat untuk ${employees.length} karyawan`,
        "success"
      );
      fetchBatches();
    } catch (err: any) {
      showDialog(err.message || "Gagal membuat payroll", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteBatch = (batchId: string, batchMonth: number, batchYear: number) => {
    showConfirm(
      `Hapus payroll ${getMonthName(batchMonth)} ${batchYear}? Semua data payroll karyawan di batch ini akan dihapus.`,
      async () => {
        const { error } = await supabase
          .from("payroll_batches")
          .delete()
          .eq("id", batchId);

        if (!error) {
          showDialog("Batch payroll berhasil dihapus", "success");
          fetchBatches();
        } else {
          showDialog(error.message, "error");
        }
      }
    );
  };

  // Find if selected month/year already has a batch
  const selectedBatchExists = batches.some(
    (b) => b.month === month && b.year === year
  );

  return (
    <div>
      <PageMeta
        title="Manajemen Payroll | HRIS"
        description="Payroll management page"
      />
      <PageBreadcrumb pageTitle="Manajemen Payroll" />

      {/* OVERVIEW CARDS */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="stat-card group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-brand-50 dark:bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-500 group-hover:scale-125" />
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Karyawan Aktif
              </p>
              <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {totalEmployees}
              </h3>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/15">
              <Users className="text-brand-500 w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="stat-card group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-success-50 dark:bg-success-500/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-500 group-hover:scale-125" />
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Payroll Bulan Ini
              </p>
              <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                {currentBatch
                  ? `Rp ${formatRupiah(currentBatch.total_salary)}`
                  : "—"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {currentBatch
                  ? `${currentBatch.total_employees} karyawan`
                  : "Belum di-generate"}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-success-50 dark:bg-success-500/15">
              <Banknote className="text-success-500 w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="stat-card group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-warning-50 dark:bg-warning-500/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-500 group-hover:scale-125" />
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                Total Batch
              </p>
              <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {batches.length}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">periode payroll</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-warning-50 dark:bg-warning-500/15">
              <TrendingUp className="text-warning-500 w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card dark:border-gray-800 dark:bg-gray-900 space-y-6">
        {/* GENERATE SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Generate Payroll
            </h2>
            <p className="section-subtitle mt-1">
              Pilih periode lalu generate untuk membuat payroll berdasarkan data
              kehadiran, cuti, dan tunjangan karyawan.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Bulan
              </label>
              <select
                className="select-field w-auto"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {getMonthName(i + 1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Tahun
              </label>
              <select
                className="select-field w-auto"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || selectedBatchExists}
              className="btn-primary"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : selectedBatchExists ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Sudah Ada
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Generate Payroll
                </>
              )}
            </button>
          </div>
        </div>

        {/* Indicator */}
        {selectedBatchExists && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20">
            <AlertTriangle className="w-4 h-4 text-warning-500 flex-shrink-0" />
            <p className="text-sm text-warning-700 dark:text-warning-400">
              Payroll <strong>{getMonthName(month)} {year}</strong> sudah
              pernah di-generate. Hapus batch lama terlebih dahulu jika ingin
              generate ulang.
            </p>
          </div>
        )}

        {/* BATCH TABLE */}
        <div>
          <h3 className="section-title mb-4">Riwayat Payroll</h3>

          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Periode</th>
                  <th>Karyawan</th>
                  <th>Total Gaji</th>
                  <th>Tanggal Generate</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                        Memuat data...
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && batches.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-gray-400 dark:text-gray-500"
                    >
                      Belum ada payroll batch
                    </td>
                  </tr>
                )}

                {batches.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {getMonthName(b.month)} {b.year}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">
                        {b.total_employees} orang
                      </span>
                    </td>
                    <td className="font-semibold text-brand-600 dark:text-brand-400">
                      Rp {formatRupiah(b.total_salary)}
                    </td>
                    <td className="text-sm text-gray-500">
                      {new Date(b.generated_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/payroll-detail/${b.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </Link>
                        <button
                          onClick={() =>
                            handleDeleteBatch(b.id, b.month, b.year)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25 transition-colors"
                          title="Hapus batch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}