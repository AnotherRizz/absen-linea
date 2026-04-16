import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../services/supabaseClient";
import { useToast } from "../../../components/ui/useToast";
import EmployeeFormComponent from "../../../components/form/employee/EmployeeForm";
import { ArrowLeft } from "lucide-react";
import { useDialog } from "../../../components/ui/AppDialog";

export default function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { showToast, ToastContainer } = useToast();
  const { showDialog } = useDialog();

  const [loading, setLoading] = useState(false);

  const [divisions, setDivisions] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  const [form, setForm] = useState({
    employee_code: "",
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
    division_id: "",
    position_id: "",
    employment_type_id: "",
    direct_manager_id: "",
    join_date: "",
    end_date: "",
    status: "active",
    basic_salary: 0,
    daily_meal_allowance: 0,
    daily_fuel_allowance: 0,
    other_allowance: 0,
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    is_active: true,
  });

  const fetchMasterData = async () => {
    const [divRes, posRes, typeRes, managerRes] = await Promise.all([
      supabase.from("divisions").select("id,name").order("name"),
      supabase.from("positions").select("id,name").order("name"),
      supabase.from("employment_types").select("id,name").order("name"),
      supabase.from("employees").select("id,full_name").order("full_name"),
    ]);

    if (divRes.data) setDivisions(divRes.data);
    if (posRes.data) setPositions(posRes.data);
    if (typeRes.data) setEmploymentTypes(typeRes.data);
    if (managerRes.data) setManagers(managerRes.data);
  };

  const fetchEmployee = async () => {
    if (!id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setForm({
        ...form,
        employee_code: data.employee_code ?? "",
        full_name: data.full_name ?? "",
        nickname: data.nickname ?? "",
        gender: data.gender ?? "",
        place_of_birth: data.place_of_birth ?? "",
        date_of_birth: data.date_of_birth ?? "",
        national_id: data.national_id ?? "",
        npwp: data.npwp ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        emergency_contact_name: data.emergency_contact_name ?? "",
        emergency_contact_phone: data.emergency_contact_phone ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
        province: data.province ?? "",
        postal_code: data.postal_code ?? "",
        division_id: data.division_id ?? "",
        position_id: data.position_id ?? "",
        employment_type_id: data.employment_type_id ?? "",
        direct_manager_id: data.direct_manager_id ?? "",
        join_date: data.join_date ?? "",
        end_date: data.end_date ?? "",
        status: data.status ?? "active",
        basic_salary: Number(data.basic_salary) || 0,
        daily_meal_allowance: Number(data.daily_meal_allowance) || 0,
        daily_fuel_allowance: Number(data.daily_fuel_allowance) || 0,
        other_allowance: Number(data.other_allowance) || 0,
        bank_name: data.bank_name ?? "",
        bank_account_number: data.bank_account_number ?? "",
        bank_account_name: data.bank_account_name ?? "",
        is_active: data.is_active ?? true,
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMasterData();
    fetchEmployee();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return; // Prevent double submit

    // Validate required fields
    if (!form.full_name.trim()) {
      showDialog("Nama lengkap wajib diisi", "warning");
      return;
    }

    if (!form.email.trim()) {
      showDialog("Email wajib diisi", "warning");
      return;
    }

    if (!form.phone.trim()) {
      showDialog("Nomor telepon wajib diisi", "warning");
      return;
    }

    if (form.basic_salary < 0 || form.daily_meal_allowance < 0 || form.daily_fuel_allowance < 0 || form.other_allowance < 0) {
      showDialog("Nilai gaji dan tunjangan tidak boleh negatif", "warning");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        division_id: form.division_id || null,
        position_id: form.position_id || null,
        employment_type_id: form.employment_type_id || null,
        direct_manager_id: form.direct_manager_id || null,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("employees")
          .update(payload)
          .eq("id", id);

        if (error) throw error;

        showToast("Data karyawan berhasil diperbarui", "success");
      } else {
        const { error } = await supabase.from("employees").insert([payload]);

        if (error) throw error;

        showToast("Data karyawan berhasil disimpan", "success");
      }

      setTimeout(() => navigate("/employee-management"), 1000);
    } catch (err: any) {
      showToast(err.message || "Something went wrong", "error");
    }

    setLoading(false);
  };

  return (
    <>
      <Link
        to="/employee-management"
        className="back-link mb-4 inline-flex">
        <ArrowLeft className="w-4 h-4" />
        Kembali Kehalaman Karyawan
      </Link>

      <div className="premium-card dark:border-gray-800 dark:bg-gray-900">
        <ToastContainer />

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {isEdit ? "Edit Employee" : "Create Employee"}
        </h2>

        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Tambah dan update data karyawan</p>

        <EmployeeFormComponent
          form={form}
          setForm={setForm}
          divisions={divisions}
          positions={positions}
          employmentTypes={employmentTypes}
          managers={managers}
          onSubmit={handleSubmit}
          loading={loading}
          isEdit={isEdit}
        />
      </div>
    </>
  );
}
