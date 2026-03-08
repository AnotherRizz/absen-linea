import { useEffect, useState } from "react";
import { supabase } from "../../../../services/supabaseClient";
import { useDialog } from "../../../../components/ui/AppDialog";
import EmployeeSearchSelect from "../../../../components/common/EmployeeSearchSelect";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../../../utils/timeFormatter";

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
    console.log(data);

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
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full font-medium ${map[status] || "bg-gray-100 text-gray-600"}`}>
        {status === "pending" && "Menunggu Persetujuan"}
        {status === "approved" && "Disetujui"}
        {status === "rejected" && "Ditolak"}
      </span>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Pengajuan Cuti
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Cari karyawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <button
            onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            + Ajukan Cuti
          </button>
        </div>
      </div>

      {/* Table Desktop */}
      <div className=" overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b dark:border-gray-700 text-gray-500">
            <tr>
              <th className="py-3 text-left">Karyawan</th>
              <th className="text-left">Jenis Cuti</th>
              <th className="text-left">Tanggal Mulai</th>
              <th className="text-left">Tanggal Selesai</th>
              <th className="text-left">Total</th>
              <th className="text-left">Status</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                onClick={() =>
                  navigate(`/leave-management/leave-request/${r.id}`)
                }
                className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                <td className="py-3 font-medium text-gray-800 dark:text-white">
                  {r.employees?.full_name}
                </td>
                <td className="py-3 font-medium text-gray-800 dark:text-white">
                  {r.leave_types?.name}
                </td>
                <td className="py-3 font-medium text-gray-800 dark:text-white">
                  {formatDate(r.start_date)}
                </td>
                <td className="py-3 font-medium text-gray-800 dark:text-white">
                  {formatDate(r.end_date)}
                </td>
                <td className="py-3 font-medium text-gray-800 dark:text-white">
                  {r.total_days} hari
                </td>

                <td className="py-3 font-medium text-gray-800 dark:text-white">
                  <StatusBadge status={r.status} />
                </td>

                <td className="text-right ">
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
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialog Form */}
      {openDialog && (
        <div className="fixed inset-0 flex max-h-screen items-center justify-center bg-black/40 z-999">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl space-y-4">
            <h4 className="text-lg font-semibold">
              {editing ? "Edit Pengajuan Cuti" : "Ajukan Cuti"}
            </h4>
            <div className=" grid grid-cols-1 md:grid-cols-2 md:gap-4">
              <div>
                <label className="text-sm font-medium">Karyawan</label>

                <EmployeeSearchSelect
                  employees={employees}
                  value={form.employee_id}
                  onChange={(id: any) => setForm({ ...form, employee_id: id })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Jenis Cuti</label>
                <select
                  value={form.leave_type_id}
                  onChange={(e) =>
                    setForm({ ...form, leave_type_id: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 mt-1">
                  <option value="">Pilih Jenis Cuti</option>
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Tanggal Mulai</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tanggal Selesai</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Total Hari</label>
                <input
                  type="number"
                  value={form.total_days}
                  onChange={(e) =>
                    setForm({ ...form, total_days: Number(e.target.value) })
                  }
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Keterangan</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOpenDialog(false)}
                className="border px-4 py-2 rounded-lg">
                Batal
              </button>

              <button
                onClick={saveRequest}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
