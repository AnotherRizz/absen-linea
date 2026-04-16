import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useDialog } from "../../components/ui/AppDialog";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import DatePicker from "../../components/form/date-picker";
import { ArrowLeft, CalendarDays, Upload } from "lucide-react";

export default function LeaveRequestFormPage() {
  const navigate = useNavigate();
  const { showDialog } = useDialog();

  const { user  } = useAuth();
const employeeId = user?.employeeId;

  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [quota, setQuota] = useState<any>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<any>(null);

  const [form, setForm] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    total_days: 0,
    reason: "",
  });

  useEffect(() => {
    fetchLeaveTypes();
    fetchQuota();
  }, []);

  useEffect(() => {
    if (form.start_date && form.end_date) {
      const start = new Date(form.start_date);
      const end = new Date(form.end_date);

      const diff =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;

      setForm((prev) => ({
        ...prev,
        total_days: diff > 0 ? diff : 0,
      }));
    }
  }, [form.start_date, form.end_date]);

  async function fetchLeaveTypes() {
    const { data } = await supabase
      .from("leave_types")
      .select("*")
      .order("name");

    setLeaveTypes(data || []);
  }

  async function fetchQuota() {
    const { data } = await supabase
      .from("employee_leave_balances")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("year", new Date().getFullYear())
      .single();

    setQuota(data);
  }
  function handleFile(e: any) {
    const f = e.target.files?.[0];
    if (!f) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];

    if (!allowed.includes(f.type)) {
      showDialog("File harus berupa gambar atau PDF", "warning");
      return;
    }

    setFile(f);

    if (f.type.startsWith("image")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  async function uploadFile() {
    if (!file) return null;

    const ext = file.name.split(".").pop();
    const fileName = `${employeeId}_${Date.now()}.${ext}`;
    const path = `leave/${fileName}`;

    const { error } = await supabase.storage
      .from("leave-attachment")
      .upload(path, file);

    if (error) {
      showDialog("Upload lampiran gagal", "error");
      return null;
    }

    const { data } = supabase.storage
      .from("leave-attachment")
      .getPublicUrl(path);
      console.log(data, error);

    return data.publicUrl;
  }

  async function submit() {
    if (!form.leave_type_id) {
      showDialog("Jenis cuti wajib dipilih", "warning");
      return;
    }

    if (!form.start_date || !form.end_date) {
      showDialog("Tanggal mulai dan selesai wajib diisi", "warning");
      return;
    }

    if (form.total_days <= 0) {
      showDialog("Tanggal tidak valid. Tanggal selesai harus setelah tanggal mulai.", "warning");
      return;
    }

    if (!form.reason || form.reason.trim() === "") {
      showDialog("Keterangan / alasan wajib diisi", "warning");
      return;
    }

    const leaveType = leaveTypes.find((l) => l.id === form.leave_type_id);

    if (!leaveType) {
      showDialog("Jenis cuti tidak valid", "warning");
      return;
    }

    if (leaveType.reduce_quota) {
      if (!quota) {
        showDialog("Data kuota cuti belum tersedia. Hubungi admin.", "error");
        return;
      }
      if (form.total_days > (quota.remaining_days || 0)) {
        showDialog(`Sisa kuota cuti tidak mencukupi. Sisa: ${quota.remaining_days || 0} hari, diajukan: ${form.total_days} hari.`, "error");
        return;
      }
    }

    const attachment = await uploadFile();

    const { error } = await supabase.from("leave_requests").insert({
      employee_id: employeeId,
      leave_type_id: form.leave_type_id,
      start_date: form.start_date,
      end_date: form.end_date,
      total_days: form.total_days,
      reason: form.reason.trim(),
      attachment_url: attachment,
      status: "pending",
    });

    if (error) {
      showDialog("Gagal mengajukan cuti", "error");
      return;
    }

    showDialog("Pengajuan berhasil dikirim", "success");

    navigate("/leave");
  }

  const leaveType = leaveTypes.find((l) => l.id === form.leave_type_id);

  return (
    <div>
      <PageMeta title="Ajukan Izin / Cuti" description="" />

      <PageBreadcrumb pageTitle="Ajukan Izin / Cuti" />

      <div className="max-w-5xl mx-auto premium-card dark:border-gray-800 dark:bg-gray-900 space-y-8">
        {/* Kuota */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</p>
            <p className="font-bold text-gray-800 dark:text-gray-200 text-xl mt-1">{quota?.total_days || 0}</p>
          </div>

          <div className="rounded-xl border border-warning-200 dark:border-warning-500/30 p-4 bg-warning-50 dark:bg-warning-500/10">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Digunakan</p>
            <p className="font-bold text-warning-600 dark:text-warning-400 text-xl mt-1">
              {quota?.used_days || 0}
            </p>
          </div>

          <div className="rounded-xl border border-success-200 dark:border-success-500/30 p-4 bg-success-50 dark:bg-success-500/10">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Sisa</p>
            <p className="font-bold text-success-600 dark:text-success-400 text-xl mt-1">
              {quota?.remaining_days || 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Jenis Cuti */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Jenis Izin / Cuti</label>

            <select
              className="select-field"
              value={form.leave_type_id}
              onChange={(e) =>
                setForm({ ...form, leave_type_id: e.target.value })
              }>
              <option value="">Pilih Jenis</option>

              {leaveTypes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>

            {leaveType && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {leaveType.reduce_quota
                  ? "Pengajuan ini akan mengurangi kuota cuti"
                  : "Pengajuan ini tidak mengurangi kuota cuti"}
              </p>
            )}
          </div>

          {/* Tanggal */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pilih Tanggal Cuti</label>

            <DatePicker
              id="leave-date"
              mode="range"
              placeholder="Pilih range tanggal"
              onChange={(dates: Date[]) => {
                if (dates.length === 2) {
                  const start = dates[0];
                  const end = dates[1];

                  const format = (d: Date) =>
                    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
                      d.getDate(),
                    ).padStart(2, "0")}`;

                  const startDate = format(start);
                  const endDate = format(end);

                  const diff =
                    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) +
                    1;

                  setForm((prev) => ({
                    ...prev,
                    start_date: startDate,
                    end_date: endDate,
                    total_days: diff > 0 ? diff : 0,
                  }));
                }
              }}
            />
          </div>

          {/* Total Hari */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Hari</label>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {form.total_days} Hari
              </span>
            </div>
          </div>

          {/* Lampiran */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Lampiran (PDF / Gambar)
            </label>

            <label
              htmlFor="file-upload"
              className="mt-1 flex items-center justify-center gap-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl px-4 py-4 text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-brand-400 transition-all duration-200">
              <Upload className="w-5 h-5 text-gray-400" />
              <span>Pilih file atau drag & drop</span>
            </label>

            <input
              id="file-upload"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFile}
              className="hidden"
            />

            {preview && (
              <img src={preview} className="mt-3 w-32 rounded-xl border dark:border-gray-700" />
            )}

            {file && file.type === "application/pdf" && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                File PDF dipilih: {file.name}
              </p>
            )}
          </div>

          {/* Keterangan */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Keterangan</label>

            <textarea
              className="input-field"
              rows={3}
              placeholder="Tuliskan alasan cuti... (wajib diisi)"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
            />
          </div>
        </div>
        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={() => navigate("/leave")}
            className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Batal
          </button>

          <button
            onClick={submit}
            className="btn-primary">
            Ajukan
          </button>
        </div>
      </div>
    </div>
  );
}
