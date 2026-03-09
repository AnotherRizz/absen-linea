import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useDialog } from "../../components/ui/AppDialog";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import DatePicker from "../../components/form/date-picker";

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
    const leaveType = leaveTypes.find((l) => l.id === form.leave_type_id);

    if (!leaveType) {
      showDialog("Jenis cuti wajib dipilih", "warning");
      return;
    }

    if (leaveType.reduce_quota && form.total_days > quota.remaining_days) {
      showDialog("Sisa kuota cuti tidak mencukupi", "error");
      return;
    }

    const attachment = await uploadFile();

    const { error } = await supabase.from("leave_requests").insert({
      employee_id: employeeId,
      leave_type_id: form.leave_type_id,
      start_date: form.start_date,
      end_date: form.end_date,
      total_days: form.total_days,
      reason: form.reason,
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
  //   const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <PageMeta title="Ajukan Izin / Cuti" description="" />

      <PageBreadcrumb pageTitle="Ajukan Izin / Cuti" />

      <div className="max-w-5xl mx-auto bg-white rounded-2xl border p-6 space-y-6">
        {/* Kuota */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="border rounded-lg p-3">
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-semibold">{quota?.total_days || 0}</p>
          </div>

          <div className="border rounded-lg p-3">
            <p className="text-sm text-gray-500">Digunakan</p>
            <p className="font-semibold text-orange-500">
              {quota?.used_days || 0}
            </p>
          </div>

          <div className="border rounded-lg p-3">
            <p className="text-sm text-gray-500">Sisa</p>
            <p className="font-semibold text-green-600">
              {quota?.remaining_days || 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          {/* Jenis Cuti */}
          <div>
            <label className="text-sm font-medium">Jenis Izin / Cuti</label>

            <select
              className="w-full border rounded-lg px-3 py-2 mt-1"
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
              <p className="text-xs text-gray-500 mt-1">
                {leaveType.reduce_quota
                  ? "Pengajuan ini akan mengurangi kuota cuti"
                  : "Pengajuan ini tidak mengurangi kuota cuti"}
              </p>
            )}
          </div>

          {/* Tanggal */}
          <div>
            <label className="text-sm font-medium">Pilih Tanggal Cuti</label>

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
          <div className="">
            <label className="text-sm font-medium">Total Hari</label>
            <p className="border rounded-lg p-2 text-sm">
              {form.total_days} Hari
            </p>
          </div>

          {/* Lampiran */}
          <div>
            <div className="mt-2">
              <label className="text-sm font-medium">
                Lampiran (PDF / Gambar)
              </label>

              <label
                htmlFor="file-upload"
                className="mt-2 flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 transition">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>

                <span>Pilih file atau drag & drop</span>
              </label>

              <input
                id="file-upload"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFile}
                className="hidden"
              />
            </div>

            {preview && (
              <img src={preview} className="mt-3 w-32 rounded-lg border" />
            )}

            {file && file.type === "application/pdf" && (
              <p className="text-sm text-gray-500 mt-2">
                File PDF dipilih: {file.name}
              </p>
            )}
          </div>

          {/* Keterangan */}
          <div>
            <label className="text-sm font-medium">Keterangan</label>

            <textarea
              className="w-full border rounded-lg px-3 py-2 mt-1"
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
        </div>
        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate("/leave")}
            className="px-4 py-2 border rounded-lg">
            Batal
          </button>

          <button
            onClick={submit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Ajukan
          </button>
        </div>
      </div>
    </div>
  );
}
