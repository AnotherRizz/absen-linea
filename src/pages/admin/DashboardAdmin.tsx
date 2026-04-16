import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { supabase } from "../../services/supabaseClient";
import {
  Users,
  CalendarCheck,
  PlaneTakeoff,
  Banknote,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

interface RecentAttendance {
  id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  employee: { full_name: string } | null;
}

interface RecentLeave {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  employee: { full_name: string } | null;
  leave_type: { name: string } | null;
}

export default function DashboardAdmin() {
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [attendanceMonth, setAttendanceMonth] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [payrollTotal, setPayrollTotal] = useState(0);
  const [recentAttendance, setRecentAttendance] = useState<RecentAttendance[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<RecentLeave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const today = now.toISOString().split("T")[0];
      const firstDay = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;

      // 1. Total active employees
      const { count: empCount } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      setTotalEmployees(empCount || 0);

      // 2. Attendance this month
      const { count: attCount } = await supabase
        .from("attendance_records")
        .select("*", { count: "exact", head: true })
        .gte("attendance_date", firstDay);
      setAttendanceMonth(attCount || 0);

      // 3. Pending leaves
      const { count: leaveCount } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingLeaves(leaveCount || 0);

      // 4. Payroll total this month
      const { data: batchData } = await supabase
        .from("payroll_batches")
        .select("id")
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .maybeSingle();

      if (batchData) {
        const { data: payrolls } = await supabase
          .from("payrolls")
          .select("net_salary")
          .eq("payroll_batch_id", batchData.id);

        const total = (payrolls || []).reduce(
          (sum: number, p: any) => sum + (p.net_salary || 0),
          0
        );
        setPayrollTotal(total);
      }

      // 5. Recent attendance today
      const { data: recentAtt } = await supabase
        .from("attendance_records")
        .select(
          `id, attendance_date, check_in, check_out,
           employee:employees!attendance_records_employee_id_fkey(full_name)`
        )
        .eq("attendance_date", today)
        .order("check_in", { ascending: false })
        .limit(5);

      setRecentAttendance(
        (recentAtt || []).map((r: any) => ({
          id: r.id,
          attendance_date: r.attendance_date,
          check_in: r.check_in,
          check_out: r.check_out,
          employee: r.employee ?? null,
        }))
      );

      // 6. Recent leave requests
      const { data: recentLv } = await supabase
        .from("leave_requests")
        .select(
          `id, start_date, end_date, status,
           employee:employees!leave_requests_employee_id_fkey(full_name),
           leave_type:leave_types!leave_requests_leave_type_id_fkey(name)`
        )
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentLeaves(
        (recentLv || []).map((r: any) => ({
          id: r.id,
          start_date: r.start_date,
          end_date: r.end_date,
          status: r.status,
          employee: r.employee ?? null,
          leave_type: r.leave_type ?? null,
        }))
      );
    } finally {
      setLoading(false);
    }
  }

  function formatRupiah(value: number) {
    return new Intl.NumberFormat("id-ID").format(value);
  }

  function formatTime(time: string | null) {
    if (!time) return "—";
    return time.substring(0, 5);
  }

  const statusMap: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "badge badge-warning" },
    approved: { label: "Disetujui", cls: "badge badge-success" },
    rejected: { label: "Ditolak", cls: "badge badge-danger" },
  };

  const statCards = [
    {
      title: "Karyawan Aktif",
      value: totalEmployees,
      suffix: "orang",
      icon: Users,
      color: "brand",
      bgLight: "bg-brand-50",
      bgDark: "dark:bg-brand-500/15",
      textColor: "text-brand-500",
      decorBg: "bg-brand-50 dark:bg-brand-500/10",
    },
    {
      title: "Kehadiran Bulan Ini",
      value: attendanceMonth,
      suffix: "record",
      icon: CalendarCheck,
      color: "success",
      bgLight: "bg-success-50",
      bgDark: "dark:bg-success-500/15",
      textColor: "text-success-500",
      decorBg: "bg-success-50 dark:bg-success-500/10",
    },
    {
      title: "Cuti Pending",
      value: pendingLeaves,
      suffix: "pengajuan",
      icon: PlaneTakeoff,
      color: "warning",
      bgLight: "bg-warning-50",
      bgDark: "dark:bg-warning-500/15",
      textColor: "text-warning-500",
      decorBg: "bg-warning-50 dark:bg-warning-500/10",
    },
    {
      title: "Total Payroll",
      value: `Rp ${formatRupiah(payrollTotal)}`,
      suffix: "bulan ini",
      icon: Banknote,
      color: "brand",
      bgLight: "bg-blue-light-50",
      bgDark: "dark:bg-blue-light-500/15",
      textColor: "text-blue-light-500",
      decorBg: "bg-blue-light-50 dark:bg-blue-light-500/10",
    },
  ];

  return (
    <div>
      <PageMeta
        title="Dashboard Admin | HRIS"
        description="Admin dashboard overview"
      />
      <PageBreadcrumb pageTitle="Dashboard Admin" />

      {/* HERO BANNER */}
      <div className="mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-6 md:p-8 text-white shadow-xl relative">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Selamat Datang, Admin 👋
          </h2>
          <p className="mt-2 text-sm text-brand-200/80">
            Ringkasan data HRIS untuk hari{" "}
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat-card">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <div className="skeleton h-4 w-28" />
                    <div className="skeleton h-8 w-20" />
                    <div className="skeleton h-3 w-16" />
                  </div>
                  <div className="skeleton h-14 w-14 rounded-2xl" />
                </div>
              </div>
            ))
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="stat-card group">
                  <div
                    className={`absolute top-0 right-0 w-24 h-24 ${card.decorBg} rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-500 group-hover:scale-125`}
                  />
                  <div className="flex items-center justify-between relative">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {card.title}
                      </p>
                      <h3 className="mt-2 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        {typeof card.value === "number"
                          ? card.value
                          : card.value}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {card.suffix}
                      </p>
                    </div>

                    <div
                      className={`flex items-center justify-center w-14 h-14 rounded-2xl ${card.bgLight} ${card.bgDark} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className={`${card.textColor} w-7 h-7`} />
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* TABLES */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Attendance */}
        <div className="premium-card dark:border-gray-800 dark:bg-gray-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-500" />
              <h3 className="section-title">Kehadiran Hari Ini</h3>
            </div>
            <Link
              to="/attendance-management"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
            >
              Lihat Semua
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={3} className="text-center py-6">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                        Memuat...
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && recentAttendance.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="text-center py-6 text-gray-400 dark:text-gray-500"
                    >
                      Belum ada absensi hari ini
                    </td>
                  </tr>
                )}

                {!loading &&
                  recentAttendance.map((a) => (
                    <tr key={a.id}>
                      <td className="font-medium">
                        {a.employee?.full_name ?? "—"}
                      </td>
                      <td>
                        <span className="badge badge-success">
                          {formatTime(a.check_in)}
                        </span>
                      </td>
                      <td>
                        {a.check_out ? (
                          <span className="badge badge-info">
                            {formatTime(a.check_out)}
                          </span>
                        ) : (
                          <span className="badge badge-warning">Belum</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Leave Requests */}
        <div className="premium-card dark:border-gray-800 dark:bg-gray-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-warning-500" />
              <h3 className="section-title">Pengajuan Cuti Terbaru</h3>
            </div>
            <Link
              to="/leave-management"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors"
            >
              Lihat Semua
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Tipe</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={3} className="text-center py-6">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                        Memuat...
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && recentLeaves.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="text-center py-6 text-gray-400 dark:text-gray-500"
                    >
                      Belum ada pengajuan cuti
                    </td>
                  </tr>
                )}

                {!loading &&
                  recentLeaves.map((l) => {
                    const st = statusMap[l.status] || statusMap.pending;
                    return (
                      <tr key={l.id}>
                        <td className="font-medium">
                          {l.employee?.full_name ?? "—"}
                        </td>
                        <td className="text-sm">
                          {l.leave_type?.name ?? "—"}
                        </td>
                        <td>
                          <span className={st.cls}>{st.label}</span>
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
