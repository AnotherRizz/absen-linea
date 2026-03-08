import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../../services/supabaseClient";

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

  if (loading) return <div className="p-6">Memuat data...</div>;
  if (!employee) return <div className="p-6">Data tidak ditemukan</div>;

  const Field = ({ label, value }: any) => (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );

  const TabButton = ({ name, label }: any) => (
    <button
      onClick={() => setTab(name)}
      className={`px-4 py-2 border-b-2 ${
        tab === name
          ? "border-blue-600 text-blue-600 font-semibold"
          : "border-transparent text-gray-500"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">
            {employee.full_name}
          </h2>
          <p className="text-gray-500">
            {employee.positions?.name || "-"} • {employee.divisions?.name || "-"}
          </p>
        </div>

        <Link
        to="/employee-management"
        className="text-sm text-gray-500 mb-4 inline-block">
        ← Kembali Kehalaman Karyawan
      </Link>
      </div>

      {/* TABS */}
      <div className="flex border-b gap-6">
        <TabButton name="personal" label="Informasi Personal" />
        <TabButton name="job" label="Informasi Pekerjaan" />
        <TabButton name="salary" label="Gaji & Tunjangan" />
      </div>

      {/* TAB CONTENT */}

      {tab === "personal" && (
        <div className="bg-white border rounded-xl p-6 grid grid-cols-3 gap-6">

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
        <div className="bg-white border rounded-xl p-6 grid grid-cols-3 gap-6">

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
        <div className="bg-white border rounded-xl p-6 grid grid-cols-3 gap-6">

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