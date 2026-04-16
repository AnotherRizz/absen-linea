import { useEffect, useState } from "react";
import { supabase } from "../../../../services/supabaseClient";
import { useDialog } from "../../../../components/ui/AppDialog";
import { Plus, Pencil, Trash2, X } from "lucide-react";

type LeaveType = {
  id: string;
  name: string;
  max_days: number | null;
  reduce_quota: boolean | null;
};

export default function LeaveTypesTab() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);

  const { showConfirm, showDialog } = useDialog();

  const [form, setForm] = useState({
    name: "",
    max_days: "",
    reduce_quota: true,
  });

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  async function fetchLeaveTypes() {
    const { data, error } = await supabase
      .from("leave_types")
      .select("*")
      .order("name");

    if (error) {
      showDialog("Gagal memuat jenis cuti", "error");
      return;
    }

    setLeaveTypes(data || []);
  }

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      max_days: "",
      reduce_quota: true,
    });
    setOpenDialog(true);
  }

  function openEdit(item: LeaveType) {
    setEditing(item);

    setForm({
      name: item.name,
      max_days: item.max_days?.toString() || "",
      reduce_quota: item.reduce_quota ?? true,
    });

    setOpenDialog(true);
  }

  async function saveLeaveType() {
    if (!form.name.trim()) {
      showDialog("Nama cuti wajib diisi", "warning");
      return;
    }

    let error;

    if (editing) {
      const res = await supabase
        .from("leave_types")
        .update({
          name: form.name,
          max_days: form.max_days ? Number(form.max_days) : null,
          reduce_quota: form.reduce_quota,
        })
        .eq("id", editing.id);

      error = res.error;
    } else {
      const res = await supabase.from("leave_types").insert({
        name: form.name,
        max_days: form.max_days ? Number(form.max_days) : null,
        reduce_quota: form.reduce_quota,
      });

      error = res.error;
    }

    if (error) {
      showDialog("Gagal menyimpan jenis cuti", "error");
      return;
    }

    showDialog(
      editing
        ? "Jenis cuti berhasil diperbarui"
        : "Jenis cuti berhasil ditambahkan",
      "success",
    );

    setOpenDialog(false);
    fetchLeaveTypes();
  }

  function deleteLeaveType(id: string) {
    showConfirm(
      "Apakah Anda yakin ingin menghapus jenis cuti ini?",
      async () => {
        const { error } = await supabase
          .from("leave_types")
          .delete()
          .eq("id", id);

        if (error) {
          console.error(error);
          showDialog("Gagal menghapus jenis cuti", "error");
          return;
        }

        showDialog("Jenis cuti berhasil dihapus", "success");

        fetchLeaveTypes();
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="section-title">Jenis Cuti</h3>
          <p className="section-subtitle mt-1">
            Deskripsikan jenis dan ketentuan cuti
          </p>
        </div>

        <button
          onClick={openCreate}
          className="btn-primary">
          <Plus className="w-4 h-4" />
          Tambah Jenis Cuti
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Nama Cuti</th>
              <th>Maksimal Hari</th>
              <th>Mengurangi Kuota?</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {leaveTypes.map((item) => (
              <tr key={item.id}>
                <td className="font-medium">
                  {item.name}
                </td>

                <td>{item.max_days ?? "—"} Hari</td>

                <td>
                  {item.reduce_quota ? (
                    <span className="badge badge-success">Ya</span>
                  ) : (
                    <span className="badge badge-neutral">Tidak</span>
                  )}
                </td>

                <td className="text-right">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-warning-50 text-warning-600 hover:bg-warning-100 dark:bg-warning-500/15 dark:text-warning-400 dark:hover:bg-warning-500/25 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteLeaveType(item.id)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-400 dark:hover:bg-error-500/25 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {leaveTypes.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400 dark:text-gray-500">
                  Tidak ada jenis cuti
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Dialog */}
      {openDialog && (
        <div className="dialog-backdrop">
          <div className="dialog-content p-8 w-full max-w-md space-y-5">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? "Edit Jenis Cuti" : "Tambah Jenis Cuti"}
              </h4>
              <button
                onClick={() => setOpenDialog(false)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nama Cuti</label>
                <input
                  type="text"
                  placeholder="Nama Cuti"
                  className="input-field"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Maksimal Hari (opsional)</label>
                <input
                  type="number"
                  placeholder="Maksimal Hari"
                  className="input-field"
                  value={form.max_days}
                  onChange={(e) => setForm({ ...form, max_days: e.target.value })}
                />
              </div>

              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.reduce_quota}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      reduce_quota: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium">Mengurangi Kuota Cuti?</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOpenDialog(false)}
                className="btn-secondary">
                Batal
              </button>

              <button
                onClick={saveLeaveType}
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
