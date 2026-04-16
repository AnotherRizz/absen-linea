import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  FingerprintIcon,
  CalendarCheck,
  Plane,
  Fingerprint,
  TrendingUp,
} from "lucide-react";

export default function DashboardEmployee() {
  const { user, loading } = useAuth();
  const employeeId = user?.employeeId;

  const [fullName, setFullName] = useState<string>("Employee");
  const [attendanceToday, setAttendanceToday] = useState<any>(null);
  const [attendanceMonth, setAttendanceMonth] = useState<number>(0);
  const [leaveBalance, setLeaveBalance] = useState<number>(0);
  const [_recentLeaves, setRecentLeaves] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.employeeId) return;

    fetchEmployee();
    fetchDashboard();
  }, [user?.employeeId]);

  if (loading) return null;

  async function fetchEmployee() {
    const { data } = await supabase
      .from("employees")
      .select("full_name")
      .eq("id", employeeId)
      .single();

    if (data) {
      setFullName(data.full_name);
    }
  }

  async function fetchDashboard() {
    const today = new Date().toISOString().split("T")[0];

    const firstDay = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    )
      .toISOString()
      .split("T")[0];

    /* Attendance today */
    const { data: todayData } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("attendance_date", today)
      .maybeSingle();

    setAttendanceToday(todayData);

    /* Attendance this month */
    const { count } = await supabase
      .from("attendance_records")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employeeId)
      .gte("attendance_date", firstDay);

    setAttendanceMonth(count || 0);

    /* Leave balance */
    const { data: leaveBalanceData } = await supabase
      .from("employee_leave_balances")
      .select("remaining_days")
      .eq("employee_id", employeeId)
      .maybeSingle();

    setLeaveBalance(leaveBalanceData?.remaining_days || 0);

    /* Recent leave */
    const { data: leaveData } = await supabase
      .from("leave_requests")
      .select("id,start_date,end_date,status")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(5);

    setRecentLeaves(leaveData || []);
  }

  const statusToday = attendanceToday ? "Sudah Absen" : "Belum Absen";

  return (
    <div>
      <PageMeta title="Employee Dashboard | HRIS" description="Dashboard" />
      <PageBreadcrumb pageTitle="Dashboard" />

      {/* HERO BANNER */}
      <div className="mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-6 md:p-8 text-white shadow-xl relative">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

        <div className="grid gap-6 md:grid-cols-4 relative z-10">
          {/* LEFT CONTENT */}
          <div className="md:col-span-3 md:mt-6">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Selamat Datang, {fullName} 👋
            </h2>

            <p className="mt-2 text-sm text-brand-200/80">
              Ringkasan aktivitas kerja Anda hari ini{" "}
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/10">
                <p className="text-xs text-brand-200/70 font-medium">Status Presensi</p>
                <p className="text-sm md:text-base font-semibold flex items-center gap-2 mt-1">
                  <FingerprintIcon className="size-5" />
                  {statusToday}
                </p>
              </div>

              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/10">
                <p className="text-xs text-brand-200/70 font-medium">Kehadiran Bulan Ini</p>
                <p className="text-sm md:text-base font-semibold flex items-center gap-2 mt-1">
                  <TrendingUp className="size-5" />
                  {attendanceMonth} hari
                </p>
              </div>

              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3 border border-white/10">
                <p className="text-xs text-brand-200/70 font-medium">Sisa Cuti</p>
                <p className="text-sm md:text-base font-semibold flex items-center gap-2 mt-1">
                  <Plane className="size-5" />
                  {leaveBalance} hari
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="flex justify-center md:justify-end">
            <img
              src="/images/brand/nura.png"
              alt="illustration"
              className="h-28 hidden md:block md:w-72 md:h-72 md:-mt-10 object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Kehadiran */}
        <div className="stat-card group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-success-50 dark:bg-success-500/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-500 group-hover:scale-125" />
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Kehadiran Bulan Ini</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {attendanceMonth}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Total hari hadir</p>
            </div>

            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-success-50 dark:bg-success-500/15 transition-transform duration-300 group-hover:scale-110">
              <CalendarCheck className="text-success-500 w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Sisa cuti */}
        <div className="stat-card group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warning-50 dark:bg-warning-500/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-500 group-hover:scale-125" />
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Sisa Cuti</p>
              <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {leaveBalance}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Hari tersisa</p>
            </div>

            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-warning-50 dark:bg-warning-500/15 transition-transform duration-300 group-hover:scale-110">
              <Plane className="text-warning-500 w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Status presensi */}
        <div className="stat-card group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 dark:bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-500 group-hover:scale-125" />
          <div className="flex items-center justify-between relative">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Status Hari Ini</p>
              <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {statusToday}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Presensi hari ini</p>
            </div>

            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/15 transition-transform duration-300 group-hover:scale-110">
              <Fingerprint className="text-brand-500 w-7 h-7" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
