import { useEffect, useState } from "react";
import { supabase } from "../../../services/supabaseClient";
import {
  X,
  CheckCircle2,
  XCircle,
  FileText,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ReimbursementDetail {
  id: string;
  category: string;
  description: string;
  amount: number;
  receipt_url: string | null;
  status: string;
  submitted_at: string;
  notes: string | null;
  reviewed_at: string | null;
  employee: { full_name: string } | null;
}

const categoryLabels: Record<string, string> = {
  transport: "Transportasi",
  meal: "Makan",
  medical: "Medis",
  office_supply: "Perlengkapan Kantor",
  other: "Lainnya",
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

/** Parse receipt_url — supports single URL string or JSON array */
function parseReceiptUrls(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // not JSON, treat as single URL
  }
  return [raw];
}

interface Props {
  reimbursementId: string;
  onClose: () => void;
}

export default function ReimbursementDetailDialog({
  reimbursementId,
  onClose,
}: Props) {
  const [data, setData] = useState<ReimbursementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    fetchDetail();
  }, [reimbursementId]);

  const fetchDetail = async () => {
    setLoading(true);
    const { data: result } = await supabase
      .from("reimbursements")
      .select(
        `id, category, description, amount, receipt_url, status, submitted_at, notes, reviewed_at,
         employee:employees!reimbursements_employee_id_fkey(full_name)`
      )
      .eq("id", reimbursementId)
      .single();

    if (result) {
      const r: any = result;
      setData({
        id: r.id,
        category: r.category,
        description: r.description,
        amount: r.amount,
        receipt_url: r.receipt_url,
        status: r.status,
        submitted_at: r.submitted_at,
        notes: r.notes,
        reviewed_at: r.reviewed_at,
        employee: r.employee ?? null,
      });
      setNotes(r.notes || "");
      setActiveImageIdx(0);
    }
    setLoading(false);
  };

  const handleAction = async (action: "approved" | "rejected") => {
    setSubmitting(true);
    try {
      await supabase
        .from("reimbursements")
        .update({
          status: action,
          notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reimbursementId);

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const statusMap: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "badge badge-warning" },
    approved: { label: "Disetujui", cls: "badge badge-success" },
    rejected: { label: "Ditolak", cls: "badge badge-danger" },
  };

  const receiptUrls = data ? parseReceiptUrls(data.receipt_url) : [];

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-content w-full max-w-lg mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Detail Reimbursement
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-4 w-full" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="field-label">Karyawan</p>
                <p className="field-value">
                  {data.employee?.full_name ?? "—"}
                </p>
              </div>
              <div>
                <p className="field-label">Status</p>
                <p className="mt-1">
                  <span className={statusMap[data.status]?.cls}>
                    {statusMap[data.status]?.label}
                  </span>
                </p>
              </div>
              <div>
                <p className="field-label">Kategori</p>
                <p className="field-value">
                  {categoryLabels[data.category] || data.category}
                </p>
              </div>
              <div>
                <p className="field-label">Jumlah</p>
                <p className="field-value font-bold text-brand-600 dark:text-brand-400">
                  Rp {formatRupiah(data.amount)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="field-label">Deskripsi</p>
                <p className="field-value">{data.description || "—"}</p>
              </div>
              <div>
                <p className="field-label">Tanggal Pengajuan</p>
                <p className="field-value">
                  {new Date(data.submitted_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              {data.reviewed_at && (
                <div>
                  <p className="field-label">Tanggal Review</p>
                  <p className="field-value">
                    {new Date(data.reviewed_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Receipt Images Gallery */}
            {receiptUrls.length > 0 && (
              <div>
                <p className="field-label mb-2">
                  Bukti / Receipt ({receiptUrls.length} foto)
                </p>

                {/* Main Image Viewer */}
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img
                    src={receiptUrls[activeImageIdx]}
                    alt={`Receipt ${activeImageIdx + 1}`}
                    className="w-full max-h-72 object-contain bg-gray-50 dark:bg-gray-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />

                  {/* Navigation arrows */}
                  {receiptUrls.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActiveImageIdx((prev) =>
                            prev === 0 ? receiptUrls.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setActiveImageIdx((prev) =>
                            prev === receiptUrls.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Indicator */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {receiptUrls.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImageIdx(i)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              i === activeImageIdx
                                ? "bg-white w-5"
                                : "bg-white/50"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {receiptUrls.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {receiptUrls.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImageIdx(i)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          i === activeImageIdx
                            ? "border-brand-500 ring-2 ring-brand-500/20"
                            : "border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Thumb ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                <a
                  href={receiptUrls[activeImageIdx]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-brand-500 hover:text-brand-600"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Buka gambar {activeImageIdx + 1} di tab baru
                </a>
              </div>
            )}

            {/* Notes + Action */}
            {data.status === "pending" ? (
              <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-800">
                <div>
                  <label className="field-label mb-1.5 block">
                    Catatan (opsional)
                  </label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Tulis catatan untuk karyawan..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction("approved")}
                    disabled={submitting}
                    className="btn-success flex-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {submitting ? "Memproses..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleAction("rejected")}
                    disabled={submitting}
                    className="btn-danger flex-1"
                  >
                    <XCircle className="w-4 h-4" />
                    {submitting ? "Memproses..." : "Reject"}
                  </button>
                </div>
              </div>
            ) : (
              data.notes && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                  <p className="field-label mb-1">Catatan Review</p>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {data.notes}
                    </p>
                  </div>
                </div>
              )
            )}
          </>
        ) : (
          <p className="text-center text-gray-400 py-4">Data tidak ditemukan</p>
        )}
      </div>
    </div>
  );
}
