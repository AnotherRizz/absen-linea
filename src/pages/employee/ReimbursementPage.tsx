import { useEffect, useState, useRef } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  Plus,
  Upload,
  X,
  HandCoins,
  Send,
  FileText,
  Images,
} from "lucide-react";

interface FilePreview {
  file: File;
  preview: string;
}

interface Reimbursement {
  id: string;
  category: string;
  description: string;
  amount: number;
  receipt_url: string | null;
  status: string;
  submitted_at: string;
  notes: string | null;
}

const categoryOptions = [
  { value: "transport", label: "Transportasi" },
  { value: "meal", label: "Makan" },
  { value: "medical", label: "Medis" },
  { value: "office_supply", label: "Perlengkapan Kantor" },
  { value: "other", label: "Lainnya" },
];

const categoryLabels: Record<string, string> = Object.fromEntries(
  categoryOptions.map((c) => [c.value, c.label])
);

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

export default function ReimbursementPage() {
  const { user } = useAuth();
  const employeeId = user?.employeeId;

  const [data, setData] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [category, setCategory] = useState("transport");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (employeeId) fetchData();
  }, [employeeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: result } = await supabase
        .from("reimbursements")
        .select(
          "id, category, description, amount, receipt_url, status, submitted_at, notes"
        )
        .eq("employee_id", employeeId)
        .order("submitted_at", { ascending: false });

      setData(
        (result || []).map((r: any) => ({
          id: r.id,
          category: r.category,
          description: r.description,
          amount: r.amount,
          receipt_url: r.receipt_url,
          status: r.status,
          submitted_at: r.submitted_at,
          notes: r.notes,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    const newFiles: FilePreview[] = Array.from(selected).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const clearAllFiles = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !amount) return;

    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];

      // Upload each file to Supabase bucket
      for (const fp of files) {
        const fileExt = fp.file.name.split(".").pop();
        const fileName = `${employeeId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("reimbursment")
          .upload(fileName, fp.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("reimbursment")
            .getPublicUrl(fileName);
          uploadedUrls.push(urlData.publicUrl);
        } else {
          console.error("Upload error:", uploadError);
        }
      }

      // Store as JSON array if multiple, single string if one, null if none
      let receiptUrl: string | null = null;
      if (uploadedUrls.length === 1) {
        receiptUrl = uploadedUrls[0];
      } else if (uploadedUrls.length > 1) {
        receiptUrl = JSON.stringify(uploadedUrls);
      }

      const { error } = await supabase.from("reimbursements").insert({
        employee_id: employeeId,
        category,
        description,
        amount: Number(amount),
        receipt_url: receiptUrl,
      });

      if (!error) {
        setCategory("transport");
        setDescription("");
        setAmount("");
        clearAllFiles();
        setShowForm(false);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const statusMap: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "badge badge-warning" },
    approved: { label: "Disetujui", cls: "badge badge-success" },
    rejected: { label: "Ditolak", cls: "badge badge-danger" },
  };

  return (
    <div>
      <PageMeta
        title="Reimbursement | HRIS"
        description="Employee reimbursement"
      />
      <PageBreadcrumb pageTitle="Reimbursement" />

      <div className="space-y-6">
        {/* FORM SECTION */}
        <div className="premium-card dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-brand-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Pengajuan Reimbursement
              </h2>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className={showForm ? "btn-secondary" : "btn-primary"}
            >
              {showForm ? (
                <>
                  <X className="w-4 h-4" /> Batal
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Ajukan Baru
                </>
              )}
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Kategori
                  </label>
                  <select
                    className="select-field"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Jumlah (Rp)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="100000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Deskripsi <span className="text-error-500">*</span>
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Jelaskan detail reimbursement... (wajib diisi)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Multi-File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Bukti / Receipt{" "}
                  <span className="text-gray-400 font-normal">
                    (bisa lebih dari 1)
                  </span>
                </label>

                {/* Upload Zone */}
                <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 cursor-pointer hover:border-brand-400 hover:bg-brand-25 dark:hover:bg-brand-500/5 transition-all duration-200">
                  <Upload className="w-7 h-7 text-gray-400 mb-1.5" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Klik untuk upload foto bukti
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    JPG, PNG — Max 5MB per file
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFilesChange}
                  />
                </label>

                {/* Preview Grid */}
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {files.length} file dipilih
                      </span>
                      <button
                        type="button"
                        onClick={clearAllFiles}
                        className="text-xs text-error-500 hover:text-error-600 font-medium"
                      >
                        Hapus Semua
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {files.map((fp, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                          <img
                            src={fp.preview}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-28 object-cover bg-gray-50 dark:bg-gray-800"
                          />
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <div className="p-1.5 bg-gray-50 dark:bg-gray-800">
                            <p className="text-[10px] text-gray-500 truncate">
                              {fp.file.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Kirim Pengajuan
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* LIST OF REIMBURSEMENTS */}
        <div className="premium-card dark:border-gray-800 dark:bg-gray-900 space-y-4">
          <h3 className="section-title">Riwayat Pengajuan</h3>

          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th>Deskripsi</th>
                  <th>Jumlah</th>
                  <th>Bukti</th>
                  <th>Status</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                        Memuat data...
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && data.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-gray-400 dark:text-gray-500"
                    >
                      Belum ada pengajuan reimbursement
                    </td>
                  </tr>
                )}

                {!loading &&
                  data.map((r) => {
                    const st = statusMap[r.status] || statusMap.pending;
                    const urls = parseReceiptUrls(r.receipt_url);
                    return (
                      <tr key={r.id}>
                        <td className="text-sm whitespace-nowrap">
                          {new Date(r.submitted_at).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" }
                          )}
                        </td>
                        <td>
                          <span className="badge badge-neutral">
                            {categoryLabels[r.category] || r.category}
                          </span>
                        </td>
                        <td className="max-w-[200px] truncate">
                          {r.description || "—"}
                        </td>
                        <td className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          Rp {formatRupiah(r.amount)}
                        </td>
                        <td>
                          {urls.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Images className="w-3.5 h-3.5 text-brand-500" />
                              {urls.map((url, i) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-400 transition-colors"
                                >
                                  {i + 1}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td>
                          <span className={st.cls}>{st.label}</span>
                        </td>
                        <td>
                          {r.notes ? (
                            <div className="flex items-start gap-1 max-w-[180px]">
                              <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {r.notes}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
