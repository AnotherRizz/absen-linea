import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { generateLeaveRequestPdf } from "../../utils/generateLeaveRequestPdf";

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const label: any = {
    pending: "Menunggu Persetujuan",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${styles[status]}`}>
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

      <div className="min-h-screen rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors px-5 py-7 xl:px-10 xl:py-12 space-y-8">
        {/* Ringkasan Kuota */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl p-5 bg-blue-50 dark:bg-blue-900/30 transition-colors">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Kuota Cuti
            </p>
            <p className="text-2xl font-semibold text-blue-700 dark:text-blue-300">
              {quota?.total_days ?? 0} Hari
            </p>
          </div>

          <div className="rounded-xl p-5 bg-orange-50 dark:bg-orange-900/30 transition-colors">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sudah Digunakan
            </p>
            <p className="text-2xl font-semibold text-orange-600 dark:text-orange-300">
              {quota?.used_days ?? 0} Hari
            </p>
          </div>

          <div className="rounded-xl p-5 bg-emerald-50 dark:bg-emerald-900/30 transition-colors">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sisa Kuota
            </p>
            <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
              {quota?.remaining_days ?? 0} Hari
            </p>
          </div>
        </div>

        {/* Tombol Ajukan */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate("/leave/request")}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition text-white font-medium shadow-sm">
            + Ajukan Izin / Cuti
          </button>
        </div>

        {/* Riwayat Pengajuan */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Riwayat Pengajuan
          </h3>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Jenis</th>
                  <th className="px-4 text-left">Tanggal Mulai</th>
                  <th className="px-4 text-left">Tanggal Selesai</th>
                  <th className="px-4 text-left">Total</th>
                  <th className="px-4 text-left">Status</th>
                  <th className="px-4 text-left"></th>
                </tr>
              </thead>

              <tbody>
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">
                      {r.leave_types?.name}
                    </td>

                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {r.start_date}
                    </td>

                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {r.end_date}
                    </td>

                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {r.total_days} hari
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">{r.status !== "pending" &&  <button
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
                        className="text-sm px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          className="size-6">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
                          />
                        </svg>
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
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3 transition-colors shadow-sm">
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
