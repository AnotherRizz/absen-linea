import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../../services/supabaseClient";
import { useDialog } from "../../../components/ui/AppDialog";

function StatusBadge({ status }: any) {
  const map: any = {
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
    <span className={`px-3 py-1 rounded-full text-sm ${map[status]}`}>
      {label[status]}
    </span>
  );
}

export default function LeaveRequestDetailPage() {
  const { id } = useParams();
  const { showDialog } = useDialog();

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data, error } = await supabase
      .from("leave_requests")
      .select(
        `
        *,
        employees!leave_requests_employee_id_fkey(full_name),
        leave_types(name)
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      showDialog("Gagal memuat data", "error");
      return;
    }

    setData(data);
  }

  async function updateStatus(status: string) {
    const { error } = await supabase
      .from("leave_requests")
      .update({
        status,
        approved_at: new Date(),
      })
      .eq("id", id);

    if (error) {
      showDialog("Gagal memperbarui status", "error");
      return;
    }

    showDialog("Status berhasil diperbarui", "success");
    fetchData();
  }

  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl border p-6 space-y-6">
      {/* Header */}
          <Link
        to="/leave-management"
        className="text-sm text-gray-500 mb-4 inline-block">
        ← Kembali Kehalaman Izin & Cuti
      </Link>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Detail Pengajuan Cuti</h2>

          <div className="mt-2">
            <StatusBadge status={data.status} />
          </div>
        </div>

        {data.status === "pending" && (
          <div className="flex gap-3">
            <button
              onClick={() => updateStatus("approved")}
              className="px-4 flex items-center py-2 bg-green-600 text-white rounded-lg">
              Setujui
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
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </button>

            <button
              onClick={() => updateStatus("rejected")}
              className="px-4 py-2 flex items-center bg-red-600 text-white rounded-lg">
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
                  d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                />
              </svg>
              Tolak
            </button>
          </div>
        )}
        {data.status === "approved" && (
          <div className="flex gap-3">
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
          </div>
        )}
      </div>

      {/* Detail */}
      <div className="grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-gray-500">Karyawan</p>
          <p className="font-medium">{data.employees?.full_name}</p>
        </div>

        <div>
          <p className="text-gray-500">Jenis Cuti</p>
          <p className="font-medium">{data.leave_types?.name}</p>
        </div>

        <div>
          <p className="text-gray-500">Tanggal Mulai</p>
          <p className="font-medium">
            {new Date(data.start_date).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div>
          <p className="text-gray-500">Tanggal Selesai</p>
          <p className="font-medium">
            {new Date(data.end_date).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div>
          <p className="text-gray-500">Total Hari</p>
          <p className="font-medium">{data.total_days} hari</p>
        </div>

        <div>
          <p className="text-gray-500">Dibuat Pada</p>
          <p className="font-medium">
            {new Date(data.created_at).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Reason */}
      <div>
        <p className="text-gray-500 mb-1">Keterangan</p>
        <p className="text-gray-700">{data.reason || "-"}</p>
      </div>

      {/* Attachment */}
     {data.attachment_url && (
  <div className="mt-4">
    <p className="text-gray-500 mb-2">Lampiran</p>

    {/* Jika gambar */}
    {/\.(jpg|jpeg|png|webp)$/i.test(data.attachment_url) && (
      <img
        src={data.attachment_url}
        alt="Lampiran"
        className="max-w-sm rounded-lg border shadow-sm"
      />
    )}

    {/* Jika PDF */}
    {/\.pdf$/i.test(data.attachment_url) && (
      <iframe
        src={data.attachment_url}
        className="w-full h-[500px] border rounded-lg"
        title="Lampiran PDF"
      />
    )}

    {/* fallback jika tipe lain */}
    {!/\.(jpg|jpeg|png|webp|pdf)$/i.test(data.attachment_url) && (
      <a
        href={data.attachment_url}
        target="_blank"
        className="text-blue-600 underline"
      >
        Buka Lampiran
      </a>
    )}
  </div>
)}
    </div>
  );
}
