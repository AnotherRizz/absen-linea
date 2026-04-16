import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  User,
  Phone,
  MapPin,
  CreditCard,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Mail,
  Shield,
  Heart,
  Building2,
  Briefcase,
  Calendar,
} from "lucide-react";

interface EmployeeProfile {
  full_name: string;
  nickname: string;
  gender: string;
  place_of_birth: string;
  date_of_birth: string;
  national_id: string;
  npwp: string;
  email: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
}

const initialForm: EmployeeProfile = {
  full_name: "",
  nickname: "",
  gender: "",
  place_of_birth: "",
  date_of_birth: "",
  national_id: "",
  npwp: "",
  email: "",
  phone: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  address: "",
  city: "",
  province: "",
  postal_code: "",
  bank_name: "",
  bank_account_number: "",
  bank_account_name: "",
};

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const employeeId = user?.employeeId;

  const [form, setForm] = useState<EmployeeProfile>(initialForm);
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [tab, setTab] = useState("personal");

  useEffect(() => {
    if (employeeId) fetchProfile();
  }, [employeeId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select(
        `
        *,
        divisions(name),
        positions(name),
        employment_types(name),
        manager:direct_manager_id(full_name)
      `
      )
      .eq("id", employeeId)
      .single();

    if (!error && data) {
      setEmployeeInfo(data);
      setForm({
        full_name: data.full_name || "",
        nickname: data.nickname || "",
        gender: data.gender || "",
        place_of_birth: data.place_of_birth || "",
        date_of_birth: data.date_of_birth || "",
        national_id: data.national_id || "",
        npwp: data.npwp || "",
        email: data.email || "",
        phone: data.phone || "",
        emergency_contact_name: data.emergency_contact_name || "",
        emergency_contact_phone: data.emergency_contact_phone || "",
        address: data.address || "",
        city: data.city || "",
        province: data.province || "",
        postal_code: data.postal_code || "",
        bank_name: data.bank_name || "",
        bank_account_number: data.bank_account_number || "",
        bank_account_name: data.bank_account_name || "",
      });
    }

    setLoading(false);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;

    setSaving(true);

    const { error } = await supabase
      .from("employees")
      .update({
        full_name: form.full_name,
        nickname: form.nickname,
        gender: form.gender,
        place_of_birth: form.place_of_birth,
        date_of_birth: form.date_of_birth || null,
        national_id: form.national_id,
        npwp: form.npwp,
        phone: form.phone,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        address: form.address,
        city: form.city,
        province: form.province,
        postal_code: form.postal_code,
        bank_name: form.bank_name,
        bank_account_number: form.bank_account_number,
        bank_account_name: form.bank_account_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employeeId);

    setSaving(false);

    if (error) {
      setToast({ type: "error", message: "Gagal menyimpan perubahan. Silakan coba lagi." });
    } else {
      setToast({ type: "success", message: "Profil berhasil diperbarui!" });
      fetchProfile();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Memuat profil...
          </p>
        </div>
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-warning-500 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">
            Akun Anda tidak terhubung dengan data karyawan.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "personal", label: "Data Pribadi", icon: User },
    { id: "contact", label: "Kontak & Alamat", icon: Phone },
    { id: "bank", label: "Rekening Bank", icon: CreditCard },
  ];

  const inputClass =
    "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all duration-200";

  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  const readOnlyClass =
    "w-full rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed";

  return (
    <div>
      <PageMeta title="Edit Profil | HRIS" description="Edit profil karyawan" />
      <PageBreadcrumb pageTitle="Edit Profil" />

      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border transition-all duration-300 animate-slide-in ${
            toast.type === "success"
              ? "bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20 text-success-700 dark:text-success-400"
              : "bg-error-50 dark:bg-error-500/10 border-error-200 dark:border-error-500/20 text-error-700 dark:text-error-400"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* PROFILE HEADER CARD */}
      <div className="mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-6 md:p-8 text-white shadow-xl relative">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5">
          {/* Avatar */}
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <User className="w-10 h-10 text-white/80" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              {employeeInfo?.full_name}
            </h2>
            <p className="mt-1 text-sm text-brand-200/80">
              {employeeInfo?.positions?.name || "—"} •{" "}
              {employeeInfo?.divisions?.name || "—"}
            </p>

            {/* Quick Info Pills */}
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs border border-white/10">
                <Mail className="w-3.5 h-3.5" />
                {employeeInfo?.email || "—"}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs border border-white/10">
                <Shield className="w-3.5 h-3.5" />
                {employeeInfo?.employee_code || "—"}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs border border-white/10">
                <Briefcase className="w-3.5 h-3.5" />
                {employeeInfo?.employment_types?.name || "—"}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs border border-white/10">
                <Calendar className="w-3.5 h-3.5" />
                Bergabung:{" "}
                {employeeInfo?.join_date
                  ? new Date(employeeInfo.join_date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
        <nav className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                  tab === t.id
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit}>
        {/* === TAB: DATA PRIBADI === */}
        {tab === "personal" && (
          <div className="space-y-6">
            {/* Identitas */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/15">
                  <User className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Informasi Identitas
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Data identitas pribadi Anda
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Nama Lengkap *</label>
                  <input
                    required
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Nama lengkap sesuai KTP"
                  />
                </div>

                <div>
                  <label className={labelClass}>Nama Panggilan</label>
                  <input
                    name="nickname"
                    value={form.nickname}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Nama panggilan sehari-hari"
                  />
                </div>

                <div>
                  <label className={labelClass}>Jenis Kelamin</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Tempat Lahir</label>
                  <input
                    name="place_of_birth"
                    value={form.place_of_birth}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Kota tempat lahir"
                  />
                </div>

                <div>
                  <label className={labelClass}>Tanggal Lahir</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={form.date_of_birth}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>NIK (KTP)</label>
                  <input
                    name="national_id"
                    value={form.national_id}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="16 digit NIK"
                    pattern="\d{16}"
                    maxLength={16}
                  />
                </div>

                <div>
                  <label className={labelClass}>NPWP</label>
                  <input
                    name="npwp"
                    value={form.npwp}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Nomor NPWP"
                  />
                </div>

                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    value={form.email}
                    readOnly
                    className={readOnlyClass}
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Email tidak dapat diubah. Hubungi admin untuk perubahan.
                  </p>
                </div>
              </div>
            </div>

            {/* Info Pekerjaan (Read-only) */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-success-50 dark:bg-success-500/15">
                  <Building2 className="w-5 h-5 text-success-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Informasi Pekerjaan
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Data ini dikelola oleh admin dan tidak dapat diubah
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Kode Karyawan</label>
                  <input
                    value={employeeInfo?.employee_code || ""}
                    readOnly
                    className={readOnlyClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Divisi</label>
                  <input
                    value={employeeInfo?.divisions?.name || "—"}
                    readOnly
                    className={readOnlyClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Jabatan</label>
                  <input
                    value={employeeInfo?.positions?.name || "—"}
                    readOnly
                    className={readOnlyClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tipe Karyawan</label>
                  <input
                    value={employeeInfo?.employment_types?.name || "—"}
                    readOnly
                    className={readOnlyClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Atasan Langsung</label>
                  <input
                    value={employeeInfo?.manager?.full_name || "—"}
                    readOnly
                    className={readOnlyClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <input
                    value={
                      employeeInfo?.status === "active"
                        ? "Aktif"
                        : employeeInfo?.status === "resigned"
                        ? "Resign"
                        : employeeInfo?.status || "—"
                    }
                    readOnly
                    className={readOnlyClass}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === TAB: KONTAK & ALAMAT === */}
        {tab === "contact" && (
          <div className="space-y-6">
            {/* Kontak */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-light-50 dark:bg-blue-light-500/15">
                  <Phone className="w-5 h-5 text-blue-light-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Nomor Telepon
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Nomor telepon aktif yang bisa dihubungi
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>No. Telepon *</label>
                  <input
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="08xxxxxxxxxx"
                    minLength={10}
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            {/* Kontak Darurat */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-error-50 dark:bg-error-500/15">
                  <Heart className="w-5 h-5 text-error-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Kontak Darurat
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Orang yang dihubungi dalam keadaan darurat
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Nama Kontak Darurat</label>
                  <input
                    name="emergency_contact_name"
                    value={form.emergency_contact_name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Nama lengkap"
                  />
                </div>
                <div>
                  <label className={labelClass}>No. Telepon Darurat</label>
                  <input
                    name="emergency_contact_phone"
                    value={form.emergency_contact_phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
            </div>

            {/* Alamat */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warning-50 dark:bg-warning-500/15">
                  <MapPin className="w-5 h-5 text-warning-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Alamat Domisili
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Alamat tempat tinggal saat ini
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className={labelClass}>Alamat Lengkap</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className={inputClass + " min-h-[80px] resize-none"}
                    placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>Kota</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Nama kota"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Provinsi</label>
                    <input
                      name="province"
                      value={form.province}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Nama provinsi"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Kode Pos</label>
                    <input
                      name="postal_code"
                      value={form.postal_code}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="12345"
                      pattern="\d{5}"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === TAB: REKENING BANK === */}
        {tab === "bank" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-theme-purple-500/10">
                  <CreditCard className="w-5 h-5 text-theme-purple-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Informasi Rekening Bank
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Data rekening untuk keperluan payroll
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Nama Bank</label>
                  <input
                    name="bank_name"
                    value={form.bank_name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Contoh: BCA, Mandiri, BNI"
                  />
                </div>
                <div>
                  <label className={labelClass}>Nomor Rekening</label>
                  <input
                    name="bank_account_number"
                    value={form.bank_account_number}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Nomor rekening bank"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Atas Nama Rekening</label>
                  <input
                    name="bank_account_name"
                    value={form.bank_account_name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Nama pemilik rekening"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-sm font-medium shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
