import { useEffect, useState } from "react";
import { supabase } from "../../../../services/supabaseClient";
import { useDialog } from "../../../../components/ui/AppDialog";
import EmployeeSearchSelect from "../../../../components/common/EmployeeSearchSelect";
import { Search, Plus, Pencil, Trash2, X } from "lucide-react";

type Employee = {
  id: string;
  full_name: string;
};


type LeaveQuota = {
  id: string;
  employee_id: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  employees: { full_name: string };
};

export default function LeaveQuotaTab() {
  const { showDialog, showConfirm } = useDialog();

  const [quotas, setQuotas] = useState<LeaveQuota[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<LeaveQuota | null>(null);

  const [form, setForm] = useState({
    employee_id: "",
    year: new Date().getFullYear(),
    total_days: 12,
    used_days: 0,
  });

  useEffect(() => {
    fetchQuotas();
    fetchEmployees();
  }, []);

  async function fetchQuotas() {
    const { data, error } = await supabase
      .from("employee_leave_balances")
      .select(
        `*,
        employees(full_name)`,
        { count: "exact" }
      )
      .order("year", { ascending: false });

    if (error) {
      showDialog("Gagal memuat data cuti", "error");
      return;
    }

    setQuotas(data || []);
  }

  async function fetchEmployees() {
    const { data } = await supabase
      .from("employees")
      .select("id,full_name")
      .order("full_name");

    setEmployees(data || []);
  }


  function openCreate() {
    setEditing(null);
    setForm({
      employee_id: "",
      year: new Date().getFullYear(),
      total_days: 12,
      used_days: 0,
    });
    setOpenDialog(true);
  }

  function openEdit(item: LeaveQuota) {
    setEditing(item);

    setForm({
      employee_id: item.employee_id,
      year: item.year,
      total_days: item.total_days,
      used_days: item.used_days,
    });

    setOpenDialog(true);
  }

  async function saveQuota() {
    if (!form.employee_id) {
      showDialog("Karyawan wajib diisi", "warning");
      return;
    }

    let error;

    if (editing) {
      const res = await supabase
        .from("employee_leave_balances")
        .update(form)
        .eq("id", editing.id);

      error = res.error;
    } else {
      const res = await supabase.from("employee_leave_balances").insert(form);

      error = res.error;
    }

    if (error) {
      showDialog(error.message, "error");
      return;
    }

    showDialog(
      editing
        ? "Kuota cuti berhasil diperbarui"
        : "Kuota cuti berhasil ditambahkan",
      "success",
    );

    setOpenDialog(false);
    fetchQuotas();
  }

  function deleteQuota(id: string) {
    showConfirm("Apakah Anda yakin ingin menghapus kuota cuti ini?", async () => {
      const { error } = await supabase
        .from("employee_leave_balances")
        .delete()
        .eq("id", id);

      if (error) {
        showDialog("Gagal menghapus kuota cuti", "error");
        return;
      }

      showDialog("Kuota cuti berhasil dihapus", "success");

      fetchQuotas();
    });
  }

  const filteredQuotas = quotas.filter((q) => {
    const matchYear = q.year === filterYear;
    const matchSearch = q.employees?.full_name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    return matchYear && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h3 className="section-title">
          Kuota Cuti Karyawan
        </h3>

        <div className="flex flex-col md:flex-row gap-3">
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

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="select-field w-auto">
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={openCreate}
            className="btn-primary">
            <Plus className="w-4 h-4" />
            Tambah Kuota
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Quota</th>
              <th>Digunakan</th>
              <th>Sisa</th>
              <th>Tahun</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {filteredQuotas.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 dark:text-gray-500">
                  Tidak ada data kuota cuti
                </td>
              </tr>
            )}
            {filteredQuotas.map((q) => (
              <tr key={q.id}>
                <td className="font-medium">
                  {q.employees?.full_name}
                </td>
                <td>
                  <span className="badge badge-info">
                    {q.total_days} Hari
                  </span>
                </td>
                <td>
                  <span className="badge badge-danger">
                    {q.used_days} Hari
                  </span>
                </td>
                <td>
                  <span className="badge badge-success">
                    {q.remaining_days} Hari
                  </span>
                </td>
                <td>
                  {q.year}
                </td>

                <td className="text-right">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => openEdit(q)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:hover:bg-brand-500/25 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteQuota(q.id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card */}
      <div className="md:hidden space-y-4">
        {filteredQuotas.map((q) => (
          <div key={q.id} className="premium-card premium-card-hover !p-4 space-y-3">
            <div className="font-semibold text-gray-800 dark:text-gray-200">{q.employees?.full_name}</div>

            <div className="flex justify-between text-sm">
              <span className="badge badge-info">{q.total_days} Hari</span>
              <span className="badge badge-danger">{q.used_days} Digunakan</span>
              <span className="badge badge-success">{q.remaining_days} Sisa</span>
            </div>

            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 items-center">
              <span>Tahun {q.year}</span>

              <div className="flex gap-2">
                <button onClick={() => openEdit(q)} className="text-brand-500 font-medium">
                  Edit
                </button>

                <button
                  onClick={() => deleteQuota(q.id)}
                  className="text-error-500 font-medium">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog */}
      {openDialog && (
        <div className="dialog-backdrop">
          <div className="dialog-content p-8 w-full max-w-md space-y-5">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? "Edit Kuota Karyawan" : "Tambah Kuota Karyawan"}
              </h4>
              <button
                onClick={() => setOpenDialog(false)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Karyawan</label>
                <EmployeeSearchSelect
                  employees={employees}
                  value={form.employee_id}
                  onChange={(id: any) => setForm({ ...form, employee_id: id })}
                />
              </div>


              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tahun</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) =>
                    setForm({ ...form, year: Number(e.target.value) })
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
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Digunakan</label>
                <input
                  type="number"
                  value={form.used_days}
                  onChange={(e) =>
                    setForm({ ...form, used_days: Number(e.target.value) })
                  }
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setOpenDialog(false)}
                className="btn-secondary">
                  Batal
              </button>

              <button
                onClick={saveQuota}
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
