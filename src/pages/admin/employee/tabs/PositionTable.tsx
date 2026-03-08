import { useEffect, useState } from "react";
import { supabase } from "../../../../services/supabaseClient";
import CrudModal from "../../../../components/common/CrudModal";
import { useDialog } from "../../../../components/ui/AppDialog";

export default function PositionTable() {
  const [data, setData] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const { showDialog, showConfirm } = useDialog();

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .order("name");

    if (!error) setData(data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!name) {
      showDialog("Nama Jabatan tidak boleh kosong.", "warning");
      return;
    }

    try {
      if (editId) {
        const { error } = await supabase
          .from("positions")
          .update({ name })
          .eq("id", editId);

        if (error) throw error;

        showDialog("Jabatan berhasil diperbarui.", "success");
      } else {
        const { error } = await supabase.from("positions").insert([{ name }]);

        if (error) throw error;

        showDialog("Jabatan berhasil ditambahkan.", "success");
      }

      setModal(false);
      setName("");
      setEditId(null);
      fetchData();
    } catch (err: any) {
      showDialog(
        err.message || "Terjadi kesalahan saat menyimpan data.",
        "error",
      );
    }
  };

  const handleEdit = (row: any) => {
    setEditId(row.id);
    setName(row.name);
    setModal(true);
  };

  const handleDelete = (id: string) => {
    showConfirm(
      "Apakah Anda yakin ingin menghapus Jabatan ini? Data yang sudah digunakan oleh karyawan mungkin akan terpengaruh.",
      async () => {
        try {
          const { error } = await supabase
            .from("positions")
            .delete()
            .eq("id", id);

          if (error) throw error;

          showDialog("Jabatan berhasil dihapus.", "success");

          fetchData();
        } catch (err: any) {
          showDialog(err.message || "Gagal menghapus Jabatan.", "error");
        }
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="font-semibold text-rose-600 text-lg">Jabatan</h3>

        <button
          onClick={() => setModal(true)}
          className="px-2 py-1 bg-rose-600 text-white rounded">
          + Tambah Jabatan Karyawan
        </button>
      </div>

      <table className="w-full border rounded-lg text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left px-4 py-3">No</th>
            <th className="text-left px-4 py-3">Nama Jabatan</th>
            <th className="px-4 py-3 w-[150px]">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row, index) => (
            <tr key={row.id} className="border-t">
              <td className="px-4 py-3">{index + 1}</td>
              <td className="px-4 py-3">{row.name}</td>

              <td className="px-4 py-3 flex gap-3">
                <button
                  onClick={() => handleEdit(row)}
                  className="text-yellow-600">
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
                  onClick={() => handleDelete(row.id)}
                  className="text-red-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <CrudModal
        open={modal}
        title={editId ? "Edit Jabatan Karyawan" : "Tambah Jabatan Karyawan"}
        value={name}
        setValue={setName}
        onClose={() => {
          setModal(false);
          setName("");
          setEditId(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
