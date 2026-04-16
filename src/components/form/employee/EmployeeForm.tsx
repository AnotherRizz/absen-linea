import { Link } from "react-router";
import { Employee } from "../../../types/employee";
import SearchSelect from "../../ui/SearchSelect";

interface Props {
  form: Employee;
  setForm: React.Dispatch<React.SetStateAction<Employee>>;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  isEdit: boolean;

  divisions: any[];
  positions: any[];
  employmentTypes: any[];
  managers: any[];
}
export default function EmployeeForm({
  form,
  setForm,
  onSubmit,
  loading,
  isEdit,
  divisions,
  positions,
  employmentTypes,
  managers,
}: Props) {
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (type === "number") {
      setForm((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : Number(value),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const inputClass =
    "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const helperClass = "text-xs text-gray-500 mt-1";

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-6">
      {/* ================= IDENTITAS ================= */}
      <div className="col-span-2 text-orange-600 font-semibold border-b pb-2">
        Informasi Identitas Karyawan
      </div>

      <div>
        <label>Kode Karyawan</label>
        <input
          name="employee_code"
          value={form.employee_code}
          onChange={handleChange}
          className={inputClass}
        />
        <p className={helperClass}>
          Kode unik karyawan. Bisa diisi manual atau otomatis dari sistem.
        </p>
      </div>

      <div>
        <label>Nama Lengkap *</label>
        <input
          required
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          className={inputClass}
        />
        <p className={helperClass}>Nama lengkap sesuai identitas resmi.</p>
      </div>

      <div>
        <label>Nama Panggilan</label>
        <input
          name="nickname"
          value={form.nickname}
          onChange={handleChange}
          className={inputClass}
        />
        <p className={helperClass}>Nama yang biasa digunakan sehari-hari.</p>
      </div>

      <div>
        <label>Jenis Kelamin</label>
        <select
          required
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className={inputClass}>
          <option value="">Pilih Jenis Kelamin</option>
          <option value="male">Laki-laki</option>
          <option value="female">Perempuan</option>
        </select>
        <p className={helperClass}>Digunakan untuk data administrasi.</p>
      </div>

      <div>
        <label>Tempat Lahir</label>
        <input
          name="place_of_birth"
          value={form.place_of_birth}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label>Tanggal Lahir</label>
        <input
          type="date"
          name="date_of_birth"
          value={form.date_of_birth}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label>NIK (KTP) *</label>
        <input
          name="national_id"
          value={form.national_id}
          onChange={handleChange}
          className={inputClass}
          pattern="\d{16}"
          maxLength={16}
          title="NIK harus 16 digit angka"
          placeholder="Contoh: 3201234567890001"
        />
        <p className={helperClass}>Nomor Induk Kependudukan 16 digit sesuai KTP.</p>
      </div>

      <div>
        <label>NPWP</label>
        <input
          name="npwp"
          value={form.npwp}
          onChange={handleChange}
          className={inputClass}
        />
        <p className={helperClass}>Nomor Pokok Wajib Pajak (jika ada).</p>
      </div>

      {/* ================= KONTAK ================= */}
      <div className="col-span-2 text-blue-600 font-semibold border-b pb-2">
        Informasi Kontak
      </div>

      <div>
        <label>Email</label>
        <input
          type="email"
          required
          name="email"
          value={form.email}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label>Nomor Telepon *</label>
        <input
          name="phone"
          required
          value={form.phone}
          onChange={handleChange}
          className={inputClass}
          pattern="[0-9+\-\s]{10,15}"
          minLength={10}
          maxLength={15}
          title="Nomor telepon minimal 10 digit"
          placeholder="Contoh: 08123456789"
        />
      </div>

      <div>
        <label>Nama Kontak Darurat</label>
        <input
          name="emergency_contact_name"
          value={form.emergency_contact_name}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label>No. Telepon Kontak Darurat</label>
        <input
          name="emergency_contact_phone"
          value={form.emergency_contact_phone}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div className="col-span-2">
        <label>Alamat Lengkap</label>
        <textarea
          name="address"
          value={form.address}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label>Kota</label>
        <input
          name="city"
          value={form.city}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label>Provinsi</label>
        <input
          name="province"
          value={form.province}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label>Kode Pos</label>
        <input
          name="postal_code"
          value={form.postal_code}
          onChange={handleChange}
          className={inputClass}
          pattern="\d{5}"
          maxLength={5}
          title="Kode pos harus 5 digit angka"
          placeholder="Contoh: 12345"
        />
      </div>

      {/* ================= PEKERJAAN ================= */}
      <div className="col-span-2 text-green-600 font-semibold border-b pb-2">
        Informasi Pekerjaan
      </div>

      <div>
        <label>Jabatan</label>
        <select
          name="position_id"
          value={form.position_id || ""}
          onChange={handleChange}
          className={inputClass}>
          <option value="">Pilih Jabatan</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Divisi</label>
        <select
          name="division_id"
          value={form.division_id || ""}
          onChange={handleChange}
          className={inputClass}>
          <option value="">Pilih Divisi</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <SearchSelect
        label="Manager / Atasan"
        value={form.direct_manager_id}
        options={managers.map((m) => ({
          id: m.id,
          label: m.full_name,
        }))}
        onChange={(val: any) =>
          setForm((prev) => ({
            ...prev,
            direct_manager_id: val,
          }))
        }
      />

      <div>
        <label>Tipe Karyawan</label>
        <select
          name="employment_type_id"
          value={form.employment_type_id || ""}
          onChange={handleChange}
          className={inputClass}>
          <option value="">Pilih Tipe</option>
          {employmentTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Tanggal Masuk</label>
        <input
          type="date"
          name="join_date"
          value={form.join_date}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label>Tanggal Berakhir</label>
        <input
          type="date"
          name="end_date"
          value={form.end_date}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label>Status Karyawan</label>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className={inputClass}>
          <option value="active">Aktif</option>
          <option value="resigned">Resign</option>
          <option value="terminated">Diberhentikan</option>
        </select>
      </div>

      {/* ================= GAJI ================= */}
      <div className="col-span-2 text-purple-600 font-semibold border-b pb-2">
        Informasi Gaji & Tunjangan
      </div>

      <div>
        <label>Gaji Pokok *</label>
        <input
          type="number"
          name="basic_salary"
          value={form.basic_salary}
          onChange={handleChange}
          className={inputClass}
          min="0"
          required
        />
        <p className={helperClass}>
          Gaji tetap per bulan sebelum tunjangan dan potongan.
        </p>
      </div>

      <div>
        <label>Uang Makan Harian</label>
        <input
          type="number"
          name="daily_meal_allowance"
          value={form.daily_meal_allowance}
          onChange={handleChange}
          className={inputClass}
          min="0"
        />
      </div>

      <div>
        <label>Uang Bensin Harian</label>
        <input
          type="number"
          name="daily_fuel_allowance"
          value={form.daily_fuel_allowance}
          onChange={handleChange}
          className={inputClass}
          min="0"
        />
      </div>

      <div>
        <label>Tunjangan Lainnya</label>
        <input
          type="number"
          name="other_allowance"
          value={form.other_allowance}
          onChange={handleChange}
          className={inputClass}
          min="0"
        />
      </div>

      {/* ================= BANK ================= */}
      <div className="col-span-2 text-indigo-600 font-semibold border-b pb-2">
        Informasi Rekening Bank
      </div>

      <div>
        <label>Nama Bank</label>
        <input
          name="bank_name"
          value={form.bank_name}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label>Nomor Rekening</label>
        <input
          name="bank_account_number"
          value={form.bank_account_number}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div>
        <label>Atas Nama Rekening</label>
        <input
          name="bank_account_name"
          value={form.bank_account_name}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      {/* ================= STATUS ================= */}
      <div className="col-span-2 flex items-center gap-3">
        <input
          type="checkbox"
          name="is_active"
          checked={form.is_active}
          onChange={handleChange}
        />
        <label>Aktif di Sistem</label>
      </div>

      <div className=" col-span-2 flex gap-2 justify-end">
        <Link to="/employee-management">
          <button
            type="button"
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg">
            Batal
          </button>{" "}
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg">
          {isEdit ? "Perbarui Data" : "Simpan Data"}
        </button>
      </div>
    </form>
  );
}
