import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { generateLeaveRequestPdf } from "../../utils/generateLeaveRequestPdf";
import { CalendarDays, CheckCircle, Clock, Plus, Printer } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    pending: "badge-warning",
    approved: "badge-success",
    rejected: "badge-danger",
  };

  const label: any = {
    pending: "Menunggu Persetujuan",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  return (
    <span className={`badge ${styles[status]}`}>
      {label[status]}
    </span>
  );
}

export default function LeavePage() {
  const navigate = useNavigate();

  const [quota, setQuota] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);

const { user } = useAuth();
const employeeId = user?.employeeId;

  useEffect(() => {
    if (!employeeId) return;

    fetchQuota();
    fetchRequests();
  }, [employeeId]);

  async function fetchQuota() {
    const { data } = await supabase
      .from("employee_leave_balances")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("year", new Date().getFullYear())
      .single();

    setQuota(data);
  }

  async function fetchRequests() {
    const { data } = await supabase
      .from("leave_requests")
      .select(
        `
      *,
      leave_types(name),
      employees!leave_requests_employee_id_fkey(full_name)
  `,
      )
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });

    console.log(data);

    setRequests(data || []);
  }

  return (
    <div>
      <PageMeta
        title="Pengajuan Izin & Cuti"
        description="Karyawan dapat mengajukan izin atau cuti."
      />

      <PageBreadcrumb pageTitle="Pengajuan Izin & Cuti" />

      <div className="premium-card dark:border-gray-800 dark:bg-gray-900 space-y-8">
        {/* Ringkasan Kuota */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card !p-5 group">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/15 transition-transform duration-300 group-hover:scale-110">
                <CalendarDays className="text-brand-500 w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Total Kuota Cuti
                </p>
                <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                  {quota?.total_days ?? 0} <span className="text-sm font-medium">Hari</span>
                </p>
              </div>
            </div>
          </div>

          <div className="stat-card !p-5 group">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-warning-50 dark:bg-warning-500/15 transition-transform duration-300 group-hover:scale-110">
                <Clock className="text-warning-500 w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Sudah Digunakan
                </p>
                <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                  {quota?.used_days ?? 0} <span className="text-sm font-medium">Hari</span>
                </p>
              </div>
            </div>
          </div>

          <div className="stat-card !p-5 group">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-success-50 dark:bg-success-500/15 transition-transform duration-300 group-hover:scale-110">
                <CheckCircle className="text-success-500 w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Sisa Kuota
                </p>
                <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                  {quota?.remaining_days ?? 0} <span className="text-sm font-medium">Hari</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Ajukan */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate("/leave/request")}
            className="btn-primary">
            <Plus className="w-4 h-4" />
            Ajukan Izin / Cuti
          </button>
        </div>

        {/* Riwayat Pengajuan */}
        <div className="space-y-4">
          <h3 className="section-title">
            Riwayat Pengajuan
          </h3>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Jenis</th>
                  <th>Tanggal Mulai</th>
                  <th>Tanggal Selesai</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400 dark:text-gray-500">
                      Belum ada pengajuan cuti
                    </td>
                  </tr>
                )}
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">
                      {r.leave_types?.name}
                    </td>

                    <td>
                      {r.start_date}
                    </td>

                    <td>
                      {r.end_date}
                    </td>

                    <td>
                      {r.total_days} hari
                    </td>

                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>{r.status !== "pending" &&  <button
                        onClick={() =>
                          generateLeaveRequestPdf({
                            employee_name: r.employees?.full_name,
                            leave_type: r.leave_types?.name,
                            start_date: r.start_date,
                            end_date: r.end_date,
                            total_days: r.total_days,
                            reason: r.reason,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors text-xs font-medium">
                        <Printer className="w-4 h-4" />
                        Print
                      </button>}
                    
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card */}
          <div className="md:hidden space-y-4">
            {requests.map((r) => (
              <div
                key={r.id}
                className="premium-card premium-card-hover !p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {r.leave_types?.name}
                  </span>

                  <StatusBadge status={r.status} />
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {r.start_date} - {r.end_date}
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Total:{" "}
                  <span className="font-medium">{r.total_days} hari</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
