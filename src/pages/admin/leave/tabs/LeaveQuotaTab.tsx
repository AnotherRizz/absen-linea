import { useEffect, useState } from "react";
import { supabase } from "../../../../services/supabaseClient";
import { useDialog } from "../../../../components/ui/AppDialog";
import EmployeeSearchSelect from "../../../../components/common/EmployeeSearchSelect";

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
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Kuota Cuti Karyawan
        </h3>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Cari karyawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm">
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={openCreate}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">
            + Tambah Kuota
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b dark:border-gray-700 text-gray-500">
            <tr>
              <th className="py-3 text-left">Nama</th>
              <th className="text-left">Quota</th>
              <th className="text-left">Digunakan</th>
              <th className="text-left">Sisa</th>
              <th className="text-left">Tahun</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {filteredQuotas.map((q) => (
              <tr
                key={q.id}
                className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5">
                <td className="py-3 font-medium text-gray-800 dark:text-white">
                  {q.employees?.full_name}
                </td>
                <td className="py-3 font-medium text-gray-800 dark:text-white">
                  <span className=" text-blue-100 bg-blue-600 py-1 px-2 rounded-full">
                    {q.total_days} Hari
                  </span>
                </td>
                <td className="py-3 font-medium text-gray-800 dark:text-white">
                  <span className=" text-red-100 bg-red-600 py-1 px-2 rounded-full">
                    {q.used_days} Hari
                  </span>
                </td>
                <td className="py-3 font-medium text-gray-800 dark:text-white">
                  <span className=" text-green-100 bg-green-600 py-1 px-2 rounded-full">
                    {q.remaining_days} Hari
                  </span>
                </td>
                <td className="py-3 font-medium text-gray-800 dark:text-white">
                  {q.year}
                </td>

                <td className="text-right space-x-3">
                  <button onClick={() => openEdit(q)} className="text-blue-600">
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
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => deleteQuota(q.id)}
                    className="text-red-600">
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
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card */}
      <div className="md:hidden space-y-4">
        {filteredQuotas.map((q) => (
          <div key={q.id} className="border rounded-xl p-4 space-y-2">
            <div className="font-semibold">{q.employees?.full_name}</div>


            <div className="flex justify-between text-sm">
              <span>Total: {q.total_days}</span>
              <span>Digunakan: {q.used_days}</span>
              <span>Sisa: {q.remaining_days}</span>
            </div>

            <div className="flex justify-between text-xs text-gray-400">
              <span>Tahun {q.year}</span>

              <div className="space-x-3">
                <button onClick={() => openEdit(q)} className="text-blue-600">
                  Edit
                </button>

                <button
                  onClick={() => deleteQuota(q.id)}
                  className="text-red-600">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog */}
      {openDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-999">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h4 className="text-lg font-semibold">
              {editing ? "Edit Kuota Karyawan" : "Tambah Kuota Karyawan"}
            </h4>

            <div>
              <label className="text-sm font-medium">Karyawan</label>
              <EmployeeSearchSelect
                employees={employees}
                value={form.employee_id}
                onChange={(id: any) => setForm({ ...form, employee_id: id })}
              />
            </div>


            <div>
              <label className="text-sm font-medium">Tahun</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) =>
                  setForm({ ...form, year: Number(e.target.value) })
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
              <label className="text-sm font-medium">Digunakan</label>
              <input
                type="number"
                value={form.used_days}
                onChange={(e) =>
                  setForm({ ...form, used_days: Number(e.target.value) })
                }
                className="w-full border rounded-lg px-3 py-2 mt-1"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setOpenDialog(false)}
                className="border px-4 py-2 rounded-lg">
                  Batal
              </button>

              <button
                onClick={saveQuota}
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
