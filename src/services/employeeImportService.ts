import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";

export async function createEmployeeWithAuth(employee: any) {
  const { data, error } = await supabase.functions.invoke(
    "create-employee-auth",
    {
      body: {
        email: employee.email,
        employee: employee,
      },
    }
  );

  if (error) {
    console.error("EDGE ERROR:", error);
    throw error;
  }

  return data;
}

/* ==============================
   HELPERS
============================== */

function norm(v?: string) {
  return (v || "").toString().toLowerCase().trim();
}

function excelDateToISO(serial: number) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000).toISOString().split("T")[0];
}

function findExactCI<T extends { name?: string; full_name?: string }>(
  list: T[],
  value?: string,
  key: "name" | "full_name" = "name"
) {
  const v = norm(value);
  if (!v) return null;
  return (
    list.find((i) => norm((i as any)[key]) === v) ||
    null
  );
}

/* fuzzy: contains match */
function findFuzzyManager(
  managers: { id: string; full_name: string }[],
  value?: string
) {
  const v = norm(value);
  if (!v) return null;

  // exact dulu
  const exact = managers.find((m) => norm(m.full_name) === v);
  if (exact) return exact;

  // contains
  const contains = managers.find((m) => norm(m.full_name).includes(v));
  if (contains) return contains;

  // split words
  const words = v.split(" ");
  const partial = managers.find((m) =>
    words.every((w) => norm(m.full_name).includes(w))
  );

  return partial || null;
}

/* ==============================
   PARSE EXCEL
============================== */

export async function parseEmployeeExcel(file: File) {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  return rows.map((row) => {
    const normalized: any = {};

    Object.keys(row).forEach((key) => {
      const cleanKey = key
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_");

      normalized[cleanKey] = row[key];
    });

    return normalized;
  });
}

/* ==============================
   PREPARE DATA + PREVIEW
============================== */

export async function prepareEmployeeImport(rows: any[]) {
  const [divRes, posRes, typeRes, managerRes] = await Promise.all([
    supabase.from("divisions").select("id,name"),
    supabase.from("positions").select("id,name"),
    supabase.from("employment_types").select("id,name"),
    supabase.from("employees").select("id,full_name"),
  ]);

  const divisions = divRes.data ?? [];
  const positions = posRes.data ?? [];
  const types = typeRes.data ?? [];
  const managers = managerRes.data ?? [];

  const prepared: any[] = [];
  const errors: any[] = [];
  const preview: any[] = [];

  rows.forEach((row, index) => {

    const division = findExactCI(divisions, row.divisi, "name");
    const position = findExactCI(positions, row.jabatan, "name");
    const type = findExactCI(types, row.tipe_karyawan, "name");
    const manager = findFuzzyManager(managers, row.manager);

    const errorList: string[] = [];

    if (!row.nama_lengkap) errorList.push("nama_lengkap kosong");

    if (row.divisi && !division)
      errorList.push(`divisi tidak ditemukan (${row.divisi})`);

    if (row.jabatan && !position)
      errorList.push(`jabatan tidak ditemukan (${row.jabatan})`);

    if (row.tipe_karyawan && !type)
      errorList.push(`tipe_karyawan tidak ditemukan (${row.tipe_karyawan})`);

    const joinDate =
      typeof row.tanggal_masuk === "number"
        ? excelDateToISO(row.tanggal_masuk)
        : row.tanggal_masuk ?? null;

    const employee = {
      employee_code:
        row.kode_karyawan ||
        `EMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,

      full_name: row.nama_lengkap,
      nickname: row.nama_panggilan ?? null,
      gender: row.jenis_kelamin ?? null,
      email: row.email ?? null,
      phone: row.no_hp ? String(row.no_hp) : null,

      division_id: division?.id ?? null,
      position_id: position?.id ?? null,
      employment_type_id: type?.id ?? null,
      direct_manager_id: manager?.id ?? null,

      join_date: joinDate,
      status: row.status?.toLowerCase() === "aktif" ? "active" : "active",

      basic_salary: Number(row.gaji_pokok) || 0,
    };

    if (errorList.length > 0) {
      errors.push({
        row: index + 2,
        errors: errorList,
      });
    }

    prepared.push(employee);

    preview.push({
      row: index + 2,
      nama: row.nama_lengkap,
      divisi: row.divisi,
      jabatan: row.jabatan,
      manager: manager?.full_name ?? row.manager ?? "-",
      status: errorList.length ? "ERROR" : "OK",
      errors: errorList,
    });
  });

  return {
    rows: prepared,
    errors,
    preview,
  };
}

/* ==============================
   IMPORT BATCH
============================== */

export async function importEmployees(rows: any[]) {
  const chunkSize = 500;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);

    const { error } = await supabase
      .from("employees")
      .insert(chunk);

    if (error) throw error;
  }
}