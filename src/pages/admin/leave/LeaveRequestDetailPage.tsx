import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../../services/supabaseClient";
import { useDialog } from "../../../components/ui/AppDialog";
import { ArrowLeft, CheckCircle, XCircle, Printer } from "lucide-react";

function StatusBadge({ status }: any) {
  const map: any = {
    pending: "badge-warning",
    approved: "badge-success",
    rejected: "badge-danger",
  };

  const label: any = {
    pending: "Menunggu Persetujuan",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  return (
    <span className={`badge ${map[status]}`}>
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
    <div className="max-w-5xl mx-auto premium-card dark:border-gray-800 dark:bg-gray-900 space-y-8">
      {/* Header */}
      <Link
        to="/leave-management"
        className="back-link">
        <ArrowLeft className="w-4 h-4" />
        Kembali Kehalaman Izin & Cuti
      </Link>
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detail Pengajuan Cuti</h2>

          <div className="mt-3">
            <StatusBadge status={data.status} />
          </div>
        </div>

        {data.status === "pending" && (
          <div className="flex gap-3">
            <button
              onClick={() => updateStatus("approved")}
              className="btn-success">
              <CheckCircle className="w-4 h-4" />
              Setujui
            </button>

            <button
              onClick={() => updateStatus("rejected")}
              className="btn-danger">
              <XCircle className="w-4 h-4" />
              Tolak
            </button>
          </div>
        )}
        {data.status === "approved" && (
          <div className="flex gap-3">
            <button className="btn-secondary">
                <Printer className="w-4 h-4" />
                Cetak
            </button>
          </div>
        )}
      </div>

      {/* Detail */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <p className="field-label">Karyawan</p>
          <p className="field-value">{data.employees?.full_name}</p>
        </div>

        <div className="space-y-1">
          <p className="field-label">Jenis Cuti</p>
          <p className="field-value">{data.leave_types?.name}</p>
        </div>

        <div className="space-y-1">
          <p className="field-label">Tanggal Mulai</p>
          <p className="field-value">
            {new Date(data.start_date).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="space-y-1">
          <p className="field-label">Tanggal Selesai</p>
          <p className="field-value">
            {new Date(data.end_date).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="space-y-1">
          <p className="field-label">Total Hari</p>
          <p className="field-value">{data.total_days} hari</p>
        </div>

        <div className="space-y-1">
          <p className="field-label">Dibuat Pada</p>
          <p className="field-value">
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
      <div className="space-y-1">
        <p className="field-label">Keterangan</p>
        <p className="field-value">{data.reason || "—"}</p>
      </div>

      {/* Attachment */}
     {data.attachment_url && (
  <div className="space-y-2">
    <p className="field-label">Lampiran</p>

    {/* Jika gambar */}
    {/\.(jpg|jpeg|png|webp)$/i.test(data.attachment_url) && (
      <img
        src={data.attachment_url}
        alt="Lampiran"
        className="max-w-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
      />
    )}

    {/* Jika PDF */}
    {/\.pdf$/i.test(data.attachment_url) && (
      <iframe
        src={data.attachment_url}
        className="w-full h-[500px] border rounded-xl dark:border-gray-700"
        title="Lampiran PDF"
      />
    )}

    {/* fallback jika tipe lain */}
    {!/\.(jpg|jpeg|png|webp|pdf)$/i.test(data.attachment_url) && (
      <a
        href={data.attachment_url}
        target="_blank"
        className="text-brand-500 underline hover:text-brand-600"
      >
        Buka Lampiran
      </a>
    )}
  </div>
)}
    </div>
  );
}
