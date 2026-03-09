import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  FingerprintIcon,
  Navigation,
  CalendarCheck,
  Plane,
  Fingerprint,
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
      <div className="mb-6 rounded-3xl md:max-h-56 overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-950 to-black p-5 md:p-7 text-white shadow-lg">
        <div className="grid gap-6 md:grid-cols-4 ">
          {/* LEFT CONTENT */}
          <div className=" md:col-span-3 md:mt-10">
            <h2 className="text-xl md:text-2xl font-semibold">
              Selamat Datang, {fullName} 👋
            </h2>

            <p className="mt-1 text-sm text-blue-200">
              Ringkasan aktivitas kerja Anda hari ini{" "}
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-blue-300">Status Presensi</p>
                <p className="text-sm md:text-base font-semibold flex gap-2">
                  <FingerprintIcon className="size-6" />
                  {statusToday}
                </p>
              </div>

              <div>
                <p className="text-xs text-blue-300">Kehadiran Bulan Ini</p>
                <p className="text-sm md:text-base font-semibold flex gap-2">
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
                      d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Zm-.001 4.5h.006v.006h-.006v-.005Zm-2.25.001h.005v.006H9.75v-.006Zm-2.25 0h.005v.005h-.006v-.005Zm6.75-2.247h.005v.005h-.005v-.005Zm0 2.247h.006v.006h-.006v-.006Zm2.25-2.248h.006V15H16.5v-.005Z"
                    />
                  </svg>
                  {attendanceMonth} hari
                </p>
              </div>

              <div>
                <p className="text-xs text-blue-300">Sisa Cuti</p>
                <p className="text-sm md:text-base font-semibold flex gap-2">
                  <Navigation />
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
              className="h-28 hidden md:block md:w-72 md:h-72 md:-mt-10 object-contain"
            />
          </div>
        </div>
      </div>

      {/* STAT CARDS */}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Kehadiran */}
        <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <div>
            <p className="text-sm text-gray-500">Kehadiran Bulan Ini</p>
            <h3 className="mt-1 text-3xl font-semibold text-gray-900">
              {attendanceMonth}
            </h3>
            <p className="text-xs text-gray-400">Total hari hadir</p>
          </div>

          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100">
            <CalendarCheck className="text-green-600 w-6 h-6" />
          </div>
        </div>

        {/* Sisa cuti */}
        <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <div>
            <p className="text-sm text-gray-500">Sisa Cuti</p>
            <h3 className="mt-1 text-3xl font-semibold text-gray-900">
              {leaveBalance}
            </h3>
            <p className="text-xs text-gray-400">Hari tersisa</p>
          </div>

          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100">
            <Plane className="text-orange-600 w-6 h-6" />
          </div>
        </div>

        {/* Status presensi */}
        <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <div>
            <p className="text-sm text-gray-500">Status Hari Ini</p>
            <h3 className="mt-1 text-2xl font-semibold text-gray-900">
              {statusToday}
            </h3>
            <p className="text-xs text-gray-400">Presensi hari ini</p>
          </div>

          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100">
            <Fingerprint className="text-purple-600 w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
