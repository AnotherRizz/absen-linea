import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../../services/supabaseClient";
import { generatePayrollSlipPdf } from "../../../utils/generatePayrollSlipPdf";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import {
  ArrowLeft,
  Download,
  Banknote,
  CalendarDays,
  CalendarMinus,
  CalendarX,
} from "lucide-react";

interface Slip {
  employee_name: string;
  basic_salary: number;
  meal: number;
  fuel: number;
  other: number;
  total_deduction: number;
  net_salary: number;
  total_work_days: number;
  total_leave_days: number;
  total_absent_days: number;
  month: number;
  year: number;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

const getMonthName = (month: number) =>
  new Date(2000, month - 1).toLocaleString("id-ID", { month: "long" });

export default function PayrollSlipPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Slip | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!id) return;

    setLoading(true);
    const { data: result } = await supabase
      .from("payrolls")
      .select(
        `
        basic_salary,
        total_meal_allowance,
        total_fuel_allowance,
        other_allowance,
        total_deduction,
        net_salary,
        total_work_days,
        total_leave_days,
        total_absent_days,
        employee:employees!payrolls_employee_id_fkey(
          full_name
        ),
        batch:payroll_batches!payrolls_payroll_batch_id_fkey(
          month,
          year
        )
      `
      )
      .eq("id", id)
      .single();

    const r: any = result;

    const formatted: Slip = {
      employee_name: r?.employee?.full_name ?? "-",
      basic_salary: r?.basic_salary ?? 0,
      meal: r?.total_meal_allowance ?? 0,
      fuel: r?.total_fuel_allowance ?? 0,
      other: r?.other_allowance ?? 0,
      total_deduction: r?.total_deduction ?? 0,
      net_salary: r?.net_salary ?? 0,
      total_work_days: r?.total_work_days ?? 0,
      total_leave_days: r?.total_leave_days ?? 0,
      total_absent_days: r?.total_absent_days ?? 0,
      month: r?.batch?.month ?? 0,
      year: r?.batch?.year ?? 0,
    };

    setData(formatted);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadPdf = () => {
    if (!data) return;
    generatePayrollSlipPdf({
      employee_name: data.employee_name,
      basic_salary: data.basic_salary,
      total_meal_allowance: data.meal,
      total_fuel_allowance: data.fuel,
      other_allowance: data.other,
      total_deduction: data.total_deduction,
      net_salary: data.net_salary,
      total_work_days: data.total_work_days,
      total_leave_days: data.total_leave_days,
      total_absent_days: data.total_absent_days,
      month: data.month,
      year: data.year,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
        Memuat data slip gaji...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400">
        Data slip gaji tidak ditemukan.
      </div>
    );
  }

  const totalAllowance = data.meal + data.fuel + data.other;
  const grossSalary = data.basic_salary + totalAllowance;

  return (
    <div>
      <PageMeta title="Slip Gaji | HRIS" description="Payroll slip detail" />
      <PageBreadcrumb pageTitle="Slip Gaji" />

      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Back + Download */}
        <div className="flex items-center justify-between">
          <Link to="/payroll" className="back-link">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Payroll
          </Link>

          <button onClick={handleDownloadPdf} className="btn-primary">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>

        {/* Slip Preview Card */}
        <div className="premium-card dark:border-gray-800 dark:bg-gray-900 space-y-6">
          {/* Header */}
          <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Slip Gaji Karyawan
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Periode: {getMonthName(data.month)} {data.year}
            </p>
          </div>

          {/* Employee Info */}
          <div className="flex justify-between items-center">
            <div>
              <p className="field-label">Nama Karyawan</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data.employee_name}
              </p>
            </div>
            <span className="badge badge-info">
              {getMonthName(data.month)} {data.year}
            </span>
          </div>

          {/* Attendance Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-brand-50 dark:bg-brand-500/10 p-4 text-center border border-brand-100 dark:border-brand-500/20">
              <CalendarDays className="w-5 h-5 text-brand-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Hari Kerja</p>
              <p className="text-xl font-bold text-brand-600 dark:text-brand-400 mt-1">
                {data.total_work_days}
              </p>
            </div>

            <div className="rounded-xl bg-warning-50 dark:bg-warning-500/10 p-4 text-center border border-warning-100 dark:border-warning-500/20">
              <CalendarMinus className="w-5 h-5 text-warning-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Hari Cuti</p>
              <p className="text-xl font-bold text-warning-600 dark:text-warning-400 mt-1">
                {data.total_leave_days}
              </p>
            </div>

            <div className="rounded-xl bg-error-50 dark:bg-error-500/10 p-4 text-center border border-error-100 dark:border-error-500/20">
              <CalendarX className="w-5 h-5 text-error-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Hari Absen</p>
              <p className={`text-xl font-bold mt-1 ${data.total_absent_days > 0 ? "text-error-600 dark:text-error-400" : "text-gray-800 dark:text-gray-200"}`}>
                {data.total_absent_days}
              </p>
            </div>
          </div>

          {/* Pendapatan */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Pendapatan
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Gaji Pokok</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Rp {formatRupiah(data.basic_salary)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tunjangan Makan</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Rp {formatRupiah(data.meal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tunjangan Bensin</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Rp {formatRupiah(data.fuel)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tunjangan Lain</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Rp {formatRupiah(data.other)}
                </span>
              </div>

              <div className="flex justify-between text-sm font-semibold border-t border-dashed border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-700 dark:text-gray-300">Total Pendapatan</span>
                <span className="text-gray-900 dark:text-white">
                  Rp {formatRupiah(grossSalary)}
                </span>
              </div>
            </div>
          </div>

          {/* Potongan */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Potongan
            </h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Potongan Absen</span>
              <span className={`font-medium ${data.total_deduction > 0 ? "text-error-600 dark:text-error-400" : "text-gray-900 dark:text-white"}`}>
                {data.total_deduction > 0 ? "-" : ""}Rp {formatRupiah(data.total_deduction)}
              </span>
            </div>
          </div>

          {/* Gaji Bersih */}
          <div className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Banknote className="w-6 h-6 text-white/70" />
              <span className="text-white font-semibold">Gaji Bersih</span>
            </div>
            <span className="text-white text-xl font-bold">
              Rp {formatRupiah(data.net_salary)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}