import { useEffect, useState } from "react";
import { supabase } from "../../../../services/supabaseClient";
import Button from "../../../../components/ui/button/Button";
import { Link } from "react-router";

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
    console.log(data);

    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, pageSize, search]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Cari Karyawan..."
          className="border rounded px-3 py-2 text-sm w-64"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />

        <div className="flex gap-2 items-center">
          <select
            className="border rounded px-2 py-2 text-sm"
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}>
            <option value={10}>10 baris</option>
            <option value={50}>50 baris</option>
            <option value={100}>100 baris</option>
          </select>
          <Link to="/employee-management/create">
            <Button>Tambah Karyawan</Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">No Telp</th>
              <th className="px-4 py-3 text-left">Tipe</th>
              <th className="px-4 py-3 text-left">Jabatan</th>
              <th className="px-4 py-3 text-left">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="border-t">
                  <td className="px-4 py-3">{emp.full_name}</td>
                  <td className="px-4 py-3">{emp.email || "-"}</td>
                  <td className="px-4 py-3">{emp.phone || "-"}</td>
                  <td className="px-4 py-3">
                    {emp.employment_types?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3">{emp.positions?.name ?? "-"}</td>
                  <td className="px-4 py-3 flex gap-2 items-center">
                    <Link to={`/employee-management/${emp.id}`}>
                      <p className=" text-green-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          className="size-6">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z"
                          />
                        </svg>
                      </p>
                    </Link>
                    <Link to={`/employee-management/edit/${emp.id}`}>
                      <p className=" text-yellow-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          className="size-6">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                          />
                        </svg>
                      </p>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <span>
          Showing {(page - 1) * pageSize + 1} -{" "}
          {Math.min(page * pageSize, total)} of {total}
        </span>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded">
            Prev
          </button>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
