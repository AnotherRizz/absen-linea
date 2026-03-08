import { useEffect, useState } from "react";
import { supabase } from "../../../../services/supabaseClient";
import { useDialog } from "../../../../components/ui/AppDialog";

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
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Jenis Cuti <br />
          <small className="text-gray-400">
            Deskripsikan jenis dan ketentuan cuti
          </small>
        </h3>

        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Tambah Jenis Cuti
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b dark:border-gray-700 text-gray-500">
            <tr>
              <th className="py-3 text-left">Nama Cuti</th>
              <th className="text-left">Maksimal Hari</th>
              <th className="text-left">Mengurangi Kuota?</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {leaveTypes.map((item) => (
              <tr
                key={item.id}
                className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5">
                <td className="py-3 font-medium text-gray-800 dark:text-white">
                  {item.name}
                </td>

                <td>{item.max_days ?? "-"} Hari</td>

                <td>
                  {item.reduce_quota ? (
                    <span className="text-green-600">Ya</span>
                  ) : (
                    <span className="text-gray-400">Tidak</span>
                  )}
                </td>

                <td className="text-right space-x-3">
                  <button
                    onClick={() => openEdit(item)}
                    className="text-yellow-600 hover:underline">
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
                    onClick={() => deleteLeaveType(item.id)}
                    className="text-red-600 hover:underline">
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

            {leaveTypes.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400">
                  No leave types found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Dialog */}
      {openDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-999">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">
              {editing ? "Edit Jenis Cuti" : "Tambah Jenis Cuti"}
            </h4>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nama Cuti"
                className="w-full border rounded-lg px-3 py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <input
                type="number"
                placeholder="Maksimal Hari (opsional)"
                className="w-full border rounded-lg px-3 py-2"
                value={form.max_days}
                onChange={(e) => setForm({ ...form, max_days: e.target.value })}
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.reduce_quota}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      reduce_quota: e.target.checked,
                    })
                  }
                />
                Mengurangi Kuota Cuti?
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setOpenDialog(false)}
                className="px-4 py-2 text-sm border rounded-lg">
                Batal
              </button>

              <button
                onClick={saveLeaveType}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
