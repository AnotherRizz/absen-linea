import { useEffect, useState } from "react";
import { supabase } from "../../../../services/supabaseClient";
import { useDialog } from "../../../../components/ui/AppDialog";
import EmployeeSearchSelect from "../../../../components/common/EmployeeSearchSelect";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../../../utils/timeFormatter";
import { Search, Plus, ChevronRight, X } from "lucide-react";

type LeaveRequest = {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  employees: { full_name: string };
  leave_types: { name: string };
};

type Employee = {
  id: string;
  full_name: string;
};

type LeaveType = {
  id: string;
  name: string;
};

export default function LeaveRequestsTab() {
  const { showDialog } = useDialog();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);

  const [search, setSearch] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<LeaveRequest | null>(null);

  const navigate = useNavigate();
  const [form, setForm] = useState({
    employee_id: "",
    leave_type_id: "",
    start_date: "",
    end_date: "",
    total_days: 1,
    reason: "",
  });

  useEffect(() => {
    fetchRequests();
    fetchEmployees();
    fetchLeaveTypes();
  }, []);

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("leave_requests")
      .select(
        `
    *,
    employees!leave_requests_employee_id_fkey(full_name),
    leave_types(name)
  `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      showDialog("Gagal memuat data cuti", "error");
      return;
    }

    setRequests(data || []);
  }

  async function fetchEmployees() {
    const { data } = await supabase
      .from("employees")
      .select("id,full_name")
      .order("full_name");

    setEmployees(data || []);
  }

  async function fetchLeaveTypes() {
    const { data } = await supabase
      .from("leave_types")
      .select("id,name")
      .order("name");

    setLeaveTypes(data || []);
  }

  function openCreate() {
    setEditing(null);
    setForm({
      employee_id: "",
      leave_type_id: "",
      start_date: "",
      end_date: "",
      total_days: 1,
      reason: "",
    });
    setOpenDialog(true);
  }

  async function saveRequest() {
    if (!form.employee_id) {
      showDialog("Karyawan wajib dipilih", "warning");
      return;
    }

    let error;

    if (editing) {
      const res = await supabase
        .from("leave_requests")
        .update(form)
        .eq("id", editing.id);

      error = res.error;
    } else {
      const res = await supabase
        .from("leave_requests")
        .insert({ ...form, status: "pending" });

      error = res.error;
    }

    if (error) {
      showDialog(error.message, "error");
      return;
    }

    showDialog("Data cuti berhasil disimpan", "success");

    setOpenDialog(false);
    fetchRequests();
  }

  const filtered = requests.filter((r) =>
    r.employees?.full_name?.toLowerCase().includes(search.toLowerCase()),
  );

  function StatusBadge({ status }: { status: string }) {
    const map: any = {
      pending: "badge-warning",
      approved: "badge-success",
      rejected: "badge-danger",
    };

    return (
      <span className={`badge ${map[status] || "badge-neutral"}`}>
        {status === "pending" && "Menunggu Persetujuan"}
        {status === "approved" && "Disetujui"}
        {status === "rejected" && "Ditolak"}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h3 className="section-title">
          Pengajuan Cuti
        </h3>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-64"
            />
          </div>

          <button
            onClick={openCreate}
            className="btn-primary">
            <Plus className="w-4 h-4" />
            Ajukan Cuti
          </button>
        </div>
      </div>

      {/* Table Desktop */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Karyawan</th>
              <th>Jenis Cuti</th>
              <th>Tanggal Mulai</th>
              <th>Tanggal Selesai</th>
              <th>Total</th>
              <th>Status</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400 dark:text-gray-500">
                  Tidak ada data pengajuan cuti
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr
                key={r.id}
                onClick={() =>
                  navigate(`/leave-management/leave-request/${r.id}`)
                }
                className="cursor-pointer">
                <td className="font-medium">
                  {r.employees?.full_name}
                </td>
                <td>
                  {r.leave_types?.name}
                </td>
                <td>
                  {formatDate(r.start_date)}
                </td>
                <td>
                  {formatDate(r.end_date)}
                </td>
                <td>
                  {r.total_days} hari
                </td>

                <td>
                  <StatusBadge status={r.status} />
                </td>

                <td className="text-right">
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialog Form */}
      {openDialog && (
        <div className="dialog-backdrop">
          <div className="dialog-content p-8 w-full max-w-3xl space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? "Edit Pengajuan Cuti" : "Ajukan Cuti"}
              </h4>
              <button
                onClick={() => setOpenDialog(false)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Karyawan</label>

                <EmployeeSearchSelect
                  employees={employees}
                  value={form.employee_id}
                  onChange={(id: any) => setForm({ ...form, employee_id: id })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Jenis Cuti</label>
                <select
                  value={form.leave_type_id}
                  onChange={(e) =>
                    setForm({ ...form, leave_type_id: e.target.value })
                  }
                  className="select-field">
                  <option value="">Pilih Jenis Cuti</option>
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal Mulai</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal Selesai</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Hari</label>
                <input
                  type="number"
                  value={form.total_days}
                  onChange={(e) =>
                    setForm({ ...form, total_days: Number(e.target.value) })
                  }
                  className="input-field"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Keterangan</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOpenDialog(false)}
                className="btn-secondary">
                Batal
              </button>

              <button
                onClick={saveRequest}
                className="btn-primary">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
