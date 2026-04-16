import { useEffect, useState } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { supabase } from "../../../services/supabaseClient";
import {
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  HandCoins,
  Filter,
} from "lucide-react";
import ReimbursementDetailDialog from "./ReimbursementDetailDialog";

interface Reimbursement {
  id: string;
  category: string;
  description: string;
  amount: number;
  receipt_url: string | null;
  status: string;
  submitted_at: string;
  notes: string | null;
  employee: { full_name: string } | null;
}

const categoryLabels: Record<string, string> = {
  transport: "Transportasi",
  meal: "Makan",
  medical: "Medis",
  office_supply: "Perlengkapan Kantor",
  other: "Lainnya",
};

const statusOptions = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function ReimbursementManagementPage() {
  const [data, setData] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("reimbursements")
        .select(
          `id, category, description, amount, receipt_url, status, submitted_at, notes,
           employee:employees!reimbursements_employee_id_fkey(full_name)`
        )
        .order("submitted_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: result, error } = await query;

      if (!error) {
        const formatted = (result || []).map((r: any) => ({
          id: r.id,
          category: r.category,
          description: r.description,
          amount: r.amount,
          receipt_url: r.receipt_url,
          status: r.status,
          submitted_at: r.submitted_at,
          notes: r.notes,
          employee: r.employee ?? null,
        }));
        setData(formatted);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const filtered = data.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.employee?.full_name?.toLowerCase().includes(s) ||
      r.description?.toLowerCase().includes(s) ||
      categoryLabels[r.category]?.toLowerCase().includes(s)
    );
  });

  const statusMap: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "badge badge-warning" },
    approved: { label: "Disetujui", cls: "badge badge-success" },
    rejected: { label: "Ditolak", cls: "badge badge-danger" },
  };

  const handleQuickAction = async (
    id: string,
    action: "approved" | "rejected"
  ) => {
    const { error } = await supabase
      .from("reimbursements")
      .update({
        status: action,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (!error) {
      fetchData();
    }
  };

  return (
    <div>
      <PageMeta
        title="Manajemen Reimbursement | HRIS"
        description="Reimbursement management page"
      />

      <PageBreadcrumb pageTitle="Manajemen Reimbursement" />

      <div className="premium-card dark:border-gray-800 dark:bg-gray-900 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <HandCoins className="w-6 h-6 text-brand-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Reimbursement
              </h2>
            </div>
            <p className="section-subtitle mt-1">
              Kelola pengajuan reimbursement dari seluruh karyawan.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Status
              </label>
              <select
                className="select-field w-auto"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Cari
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="input-field pl-9 w-56"
                  placeholder="Nama / deskripsi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Kategori</th>
                <th>Deskripsi</th>
                <th>Jumlah</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-8">
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
                    colSpan={7}
                    className="text-center py-8 text-gray-400 dark:text-gray-500"
                  >
                    Tidak ada data reimbursement
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((r) => {
                  const st = statusMap[r.status] || statusMap.pending;
                  return (
                    <tr key={r.id}>
                      <td className="font-medium">
                        {r.employee?.full_name ?? "—"}
                      </td>
                      <td>
                        <span className="badge badge-neutral">
                          {categoryLabels[r.category] || r.category}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate">
                        {r.description || "—"}
                      </td>
                      <td className="font-semibold text-gray-900 dark:text-white">
                        Rp {formatRupiah(r.amount)}
                      </td>
                      <td className="text-sm">
                        {new Date(r.submitted_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <span className={st.cls}>{st.label}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedId(r.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25 transition-colors"
                            title="Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {r.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleQuickAction(r.id, "approved")
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/15 dark:text-success-400 dark:hover:bg-success-500/25 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleQuickAction(r.id, "rejected")
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Dialog */}
      {selectedId && (
        <ReimbursementDetailDialog
          reimbursementId={selectedId}
          onClose={() => {
            setSelectedId(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
