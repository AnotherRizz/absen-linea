import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { supabase } from "../../../services/supabaseClient";
import { generatePayrollSlipPdf } from "../../../utils/generatePayrollSlipPdf";
import {
  ArrowLeft,
  Download,
  Users,
  Banknote,
  CalendarDays,
  CalendarMinus,
  CalendarX,
  TrendingDown,
  Search,
} from "lucide-react";

interface PayrollDetail {
  id: string;
  total_work_days: number;
  total_leave_days: number;
  total_absent_days: number;
  basic_salary: number;
  total_meal_allowance: number;
  total_fuel_allowance: number;
  other_allowance: number;
  total_deduction: number;
  net_salary: number;
  employee: { full_name: string } | null;
}

interface PayrollBatch {
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

export default function PayrollBatchDetailPage() {
  const { id } = useParams();

  const [data, setData] = useState<PayrollDetail[]>([]);
  const [batch, setBatch] = useState<PayrollBatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: batchData } = await supabase
        .from("payroll_batches")
        .select("month, year, total_employees, total_salary, generated_at")
        .eq("id", id)
        .single();

      setBatch(batchData as PayrollBatch | null);

      const { data: payrolls, error } = await supabase
        .from("payrolls")
        .select(
          `
          id,
          total_work_days,
          total_leave_days,
          total_absent_days,
          basic_salary,
          total_meal_allowance,
          total_fuel_allowance,
          other_allowance,
          total_deduction,
          net_salary,
          employee:employees!payrolls_employee_id_fkey (
            full_name
          )
        `
        )
        .eq("payroll_batch_id", id)
        .order("net_salary", { ascending: false });

      if (error) return;

      const formatted: PayrollDetail[] = (payrolls || []).map((item: any) => ({
        id: item.id,
        total_work_days: item.total_work_days || 0,
        total_leave_days: item.total_leave_days || 0,
        total_absent_days: item.total_absent_days || 0,
        basic_salary: item.basic_salary || 0,
        total_meal_allowance: item.total_meal_allowance || 0,
        total_fuel_allowance: item.total_fuel_allowance || 0,
        other_allowance: item.other_allowance || 0,
        total_deduction: item.total_deduction || 0,
        net_salary: item.net_salary || 0,
        employee: item.employee ?? null,
      }));

      setData(formatted);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Summary calculations
  const totalNetSalary = data.reduce((sum, d) => sum + d.net_salary, 0);
  const totalDeduction = data.reduce((sum, d) => sum + d.total_deduction, 0);
  const avgWorkDays =
    data.length > 0
      ? Math.round(
          data.reduce((sum, d) => sum + d.total_work_days, 0) / data.length
        )
      : 0;

  const filtered = data.filter((d) => {
    if (!search) return true;
    return d.employee?.full_name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <PageMeta title="Payroll Detail | HRIS" description="Payroll Detail" />
      <PageBreadcrumb pageTitle="Detail Payroll" />

      <div className="space-y-6">
        {/* Back link */}
        <Link to="/payroll" className="back-link">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Payroll
        </Link>

        {/* Header */}
        <div className="premium-card dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Payroll{" "}
                {batch
                  ? `${getMonthName(batch.month)} ${batch.year}`
                  : "..."}
              </h2>
              <p className="section-subtitle mt-1">
                Detail gaji karyawan meliputi kehadiran, cuti, tunjangan, dan
                potongan.
              </p>
              {batch && (
                <p className="text-xs text-gray-400 mt-2">
                  Di-generate pada{" "}
                  {new Date(batch.generated_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
            <span className="badge badge-info self-start">Payroll Batch</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-brand-50 dark:bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-500 group-hover:scale-125" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Karyawan
                </p>
                <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {data.length}
                </h3>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-500/15">
                <Users className="text-brand-500 w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="stat-card group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-success-50 dark:bg-success-500/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-500 group-hover:scale-125" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Total Gaji Bersih
                </p>
                <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                  Rp {formatRupiah(totalNetSalary)}
                </h3>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-success-50 dark:bg-success-500/15">
                <Banknote className="text-success-500 w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="stat-card group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-warning-50 dark:bg-warning-500/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-500 group-hover:scale-125" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Rata-rata Hari Kerja
                </p>
                <h3 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {avgWorkDays}
                </h3>
                <p className="text-[10px] text-gray-400">hari/karyawan</p>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-warning-50 dark:bg-warning-500/15">
                <CalendarDays className="text-warning-500 w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="stat-card group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-error-50 dark:bg-error-500/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-500 group-hover:scale-125" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Total Potongan
                </p>
                <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                  Rp {formatRupiah(totalDeduction)}
                </h3>
              </div>
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-error-50 dark:bg-error-500/15">
                <TrendingDown className="text-error-500 w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="premium-card dark:border-gray-800 dark:bg-gray-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="section-title">Detail Per Karyawan</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="input-field pl-9 w-56"
                placeholder="Cari karyawan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> Hadir
                    </div>
                  </th>
                  <th>
                    <div className="flex items-center gap-1">
                      <CalendarMinus className="w-3 h-3" /> Cuti
                    </div>
                  </th>
                  <th>
                    <div className="flex items-center gap-1">
                      <CalendarX className="w-3 h-3" /> Absen
                    </div>
                  </th>
                  <th>Gaji Pokok</th>
                  <th>Tunjangan</th>
                  <th>Potongan</th>
                  <th>Gaji Bersih</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                        Memuat data...
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-8 text-gray-400 dark:text-gray-500"
                    >
                      Tidak ada data payroll
                    </td>
                  </tr>
                )}

                {!loading &&
                  filtered.map((item) => {
                    const totalAllowance =
                      item.total_meal_allowance +
                      item.total_fuel_allowance +
                      item.other_allowance;
                    return (
                      <tr key={item.id}>
                        <td className="font-medium whitespace-nowrap">
                          {item.employee?.full_name ?? "—"}
                        </td>
                        <td>
                          <span className="badge badge-success">
                            {item.total_work_days} hari
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-info">
                            {item.total_leave_days} hari
                          </span>
                        </td>
                        <td>
                          {item.total_absent_days > 0 ? (
                            <span className="badge badge-danger">
                              {item.total_absent_days} hari
                            </span>
                          ) : (
                            <span className="badge badge-neutral">0</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap">
                          Rp {formatRupiah(item.basic_salary)}
                        </td>
                        <td>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500">
                              Makan:{" "}
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                Rp {formatRupiah(item.total_meal_allowance)}
                              </span>
                            </span>
                            <span className="text-xs text-gray-500">
                              BBM:{" "}
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                Rp {formatRupiah(item.total_fuel_allowance)}
                              </span>
                            </span>
                            {item.other_allowance > 0 && (
                              <span className="text-xs text-gray-500">
                                Lain:{" "}
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  Rp {formatRupiah(item.other_allowance)}
                                </span>
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 font-medium border-t border-gray-100 dark:border-gray-800 pt-0.5 mt-0.5">
                              Total: Rp {formatRupiah(totalAllowance)}
                            </span>
                          </div>
                        </td>
                        <td>
                          {item.total_deduction > 0 ? (
                            <span className="font-medium text-error-600 dark:text-error-400">
                              -Rp {formatRupiah(item.total_deduction)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="font-bold text-brand-600 dark:text-brand-400 whitespace-nowrap">
                          Rp {formatRupiah(item.net_salary)}
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              if (!batch) return;
                              generatePayrollSlipPdf({
                                employee_name: item.employee?.full_name ?? "—",
                                basic_salary: item.basic_salary,
                                total_meal_allowance: item.total_meal_allowance,
                                total_fuel_allowance: item.total_fuel_allowance,
                                other_allowance: item.other_allowance,
                                total_deduction: item.total_deduction,
                                net_salary: item.net_salary,
                                total_work_days: item.total_work_days,
                                total_leave_days: item.total_leave_days,
                                total_absent_days: item.total_absent_days,
                                month: batch.month,
                                year: batch.year,
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
