import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../../services/supabaseClient";
import { ArrowLeft, User } from "lucide-react";

export default function EmployeeShowPage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<any>(null);
  const [tab, setTab] = useState("personal");

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("employees")
      .select(`
        *,
        divisions(name),
        positions(name),
        employment_types(name),
        manager:direct_manager_id(full_name)
      `)
      .eq("id", id)
      .single();

    if (!error && data) {
      setEmployee(data);
    }

    setLoading(false);
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value || 0);
  };

  if (loading) return (
    <div className="p-6 flex items-center justify-center gap-2 text-gray-400">
      <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
      Memuat data...
    </div>
  );
  if (!employee) return <div className="p-6 text-gray-500 dark:text-gray-400">Data tidak ditemukan</div>;

  const Field = ({ label, value }: any) => (
    <div className="space-y-1">
      <p className="field-label">{label}</p>
      <p className="field-value">{value || "—"}</p>
    </div>
  );

  const tabs = [
    { id: "personal", label: "Informasi Personal" },
    { id: "job", label: "Informasi Pekerjaan" },
    { id: "salary", label: "Gaji & Tunjangan" },
  ];

  return (
    <div className="space-y-6">
      <Link to="/employee-management" className="back-link">
        <ArrowLeft className="w-4 h-4" />
        Kembali Kehalaman Karyawan
      </Link>

      {/* HEADER */}
      <div className="premium-card dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/15">
            <User className="w-7 h-7 text-brand-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {employee.full_name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {employee.positions?.name || "—"} • {employee.divisions?.name || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex gap-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`tab-btn ${tab === t.id ? "tab-btn-active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB CONTENT */}

      {tab === "personal" && (
        <div className="premium-card dark:border-gray-800 dark:bg-gray-900 grid grid-cols-1 md:grid-cols-3 gap-6">

          <Field label="Kode Karyawan" value={employee.employee_code} />
          <Field label="Nama Lengkap" value={employee.full_name} />
          <Field label="Nama Panggilan" value={employee.nickname} />

          <Field label="Jenis Kelamin" value={employee.gender} />
          <Field label="Tempat Lahir" value={employee.place_of_birth} />
          <Field label="Tanggal Lahir" value={employee.date_of_birth} />

          <Field label="NIK" value={employee.national_id} />
          <Field label="NPWP" value={employee.npwp} />

          <Field label="Email" value={employee.email} />
          <Field label="Telepon" value={employee.phone} />

          <Field label="Kontak Darurat" value={employee.emergency_contact_name} />
          <Field label="No. Kontak Darurat" value={employee.emergency_contact_phone} />

          <Field label="Alamat" value={employee.address} />
          <Field label="Kota" value={employee.city} />
          <Field label="Provinsi" value={employee.province} />

        </div>
      )}

      {tab === "job" && (
        <div className="premium-card dark:border-gray-800 dark:bg-gray-900 grid grid-cols-1 md:grid-cols-3 gap-6">

          <Field label="Divisi" value={employee.divisions?.name} />
          <Field label="Jabatan" value={employee.positions?.name} />
          <Field label="Tipe Karyawan" value={employee.employment_types?.name} />

          <Field label="Manager" value={employee.manager?.full_name} />

          <Field label="Tanggal Masuk" value={employee.join_date} />
          <Field label="Tanggal Berakhir" value={employee.end_date} />

          <Field label="Status" value={employee.status} />
          <Field
            label="Aktif di Sistem"
            value={employee.is_active ? "Ya" : "Tidak"}
          />

        </div>
      )}

      {tab === "salary" && (
        <div className="premium-card dark:border-gray-800 dark:bg-gray-900 grid grid-cols-1 md:grid-cols-3 gap-6">

          <Field
            label="Gaji Pokok"
            value={formatRupiah(employee.basic_salary)}
          />

          <Field
            label="Uang Makan Harian"
            value={formatRupiah(employee.daily_meal_allowance)}
          />

          <Field
            label="Uang Bensin Harian"
            value={formatRupiah(employee.daily_fuel_allowance)}
          />

          <Field
            label="Tunjangan Lainnya"
            value={formatRupiah(employee.other_allowance)}
          />

          <Field label="Nama Bank" value={employee.bank_name} />
          <Field label="No Rekening" value={employee.bank_account_number} />
          <Field label="Atas Nama" value={employee.bank_account_name} />

        </div>
      )}

    </div>
  );
}