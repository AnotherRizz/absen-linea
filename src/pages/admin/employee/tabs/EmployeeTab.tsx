import { useEffect, useState } from "react";
import { supabase } from "../../../../services/supabaseClient";
import Button from "../../../../components/ui/button/Button";
import { Link } from "react-router";
import { File, Eye, Pencil, Search } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;

  positions: {
    name: string;
  } | null;

  employment_types: {
    name: string;
  } | null;
}

export default function EmployeeTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchEmployees = async () => {
    setLoading(true);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

   let query = supabase
  .from("employees")
  .select(
    `
    id,
    full_name,
    email,
    phone,
    positions:positions!position_id(name),
    employment_types:employment_types!employment_type_id(name)
  `,
    { count: "exact" }
  )
  .order("created_at", { ascending: false })
  .range(from, to);

    if (search) {
      query = query.ilike("full_name", `%${search}%`);
    }

    const { data, count, error } = await query;

    if (!error) {
      const transformedData = (data || []).map((emp: any) => ({
        ...emp,
        position: emp.positions?.[0] || null,
        employment_type: emp.employment_types?.[0] || null,
      }));
      setEmployees(transformedData);
      setTotal(count || 0);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, pageSize, search]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Karyawan..."
            className="input-field pl-10 w-72"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>

        <div className="flex gap-2 items-center">
          <select
            className="select-field w-auto"
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}>
            <option value={10}>10 baris</option>
            <option value={50}>50 baris</option>
            <option value={100}>100 baris</option>
          </select>
          <Link to="/employee-management/import">
            <Button className="btn-success"><File className="w-4 h-4" /> Upload Excel</Button>
          </Link>
          <Link to="/employee-management/create">
            <Button className="btn-primary">Tambah Karyawan</Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Nama Karyawan</th>
              <th>Email</th>
              <th>Jabatan</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                    Memuat data...
                  </div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400 dark:text-gray-500">
                  Tidak ada data karyawan
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id}>
                  <td className="font-medium">{emp.full_name}</td>
                  <td>{emp.email || "—"}</td>
                  <td>{emp.positions?.name ?? "—"}</td>
                  <td>
                    <div className="flex gap-2 items-center">
                      <Link
                        to={`/employee-management/${emp.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/15 dark:text-success-400 dark:hover:bg-success-500/25 transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/employee-management/edit/${emp.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-warning-50 text-warning-600 hover:bg-warning-100 dark:bg-warning-500/15 dark:text-warning-400 dark:hover:bg-warning-500/25 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Showing {Math.min((page - 1) * pageSize + 1, total)} –{" "}
          {Math.min(page * pageSize, total)} of {total}
        </span>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="pagination-btn">
            Prev
          </button>

          <span className="pagination-btn pagination-btn-active">
            {page} / {totalPages || 1}
          </span>

          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
            className="pagination-btn">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
