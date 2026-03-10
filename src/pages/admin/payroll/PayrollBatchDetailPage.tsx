import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { supabase } from "../../../services/supabaseClient";

interface PayrollDetail {
  id: string;
  total_work_days: number;
  basic_salary: number;
  total_meal_allowance: number;
  total_fuel_allowance: number;
  other_allowance: number;
  net_salary: number;
  employee: {
    full_name: string;
  } | null;
}

interface PayrollBatch {
  month: number;
  year: number;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function PayrollBatchDetailPage() {
  const { id } = useParams();

  const [data, setData] = useState<PayrollDetail[]>([]);
  const [batch, setBatch] = useState<PayrollBatch | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: batchData } = await supabase
        .from("payroll_batches")
        .select("month, year")
        .eq("id", id)
        .single();

      setBatch(batchData);

      const { data, error } = await supabase
        .from("payrolls")
        .select(
          `
          id,
          total_work_days,
          basic_salary,
          total_meal_allowance,
          total_fuel_allowance,
          other_allowance,
          net_salary,
          employee:employees!payrolls_employee_id_fkey (
            full_name
          )
        `,
        )
        .eq("payroll_batch_id", id);

      if (error) return;

      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        total_work_days: item.total_work_days,
        basic_salary: item.basic_salary,
        total_meal_allowance: item.total_meal_allowance,
        total_fuel_allowance: item.total_fuel_allowance,
        other_allowance: item.other_allowance,
        net_salary: item.net_salary,
        employee: item.employee ?? null,
      }));

      setData(formatted);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString("id-ID", { month: "long" });
  };

  return (
    <div>
      <PageMeta title="Payroll Detail | HRIS" description="Payroll Detail" />
      <PageBreadcrumb pageTitle="Payroll Detail" />

      <div className="rounded-2xl border bg-white p-6 space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Payroll{" "}
              {batch ? `${getMonthName(batch.month)} ${batch.year}` : ""}
            </h2>

            <p className="text-sm text-gray-500">
              Detail gaji karyawan untuk periode payroll ini. Informasi meliputi
              gaji pokok, tunjangan, serta total gaji bersih.
            </p>
          </div>

          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
            Payroll Batch
          </span>
        </div>

        {/* TABLE */}

        <div className="border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Karyawan</th>
                <th className="px-4 py-3">Hari Kerja</th>
                <th className="px-4 py-3">Gaji Pokok</th>
                <th className="px-4 py-3">Tunjangan</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center py-6">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading &&
                data.map((item) => {
                  // const allowance =
                  //   item.total_meal_allowance +
                  //   item.total_fuel_allowance +
                  //   item.other_allowance;

                  return (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {item.employee?.full_name ?? "-"}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">
                          {item.total_work_days} hari
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                          Rp {formatRupiah(item.basic_salary)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md w-fit">
                            Uang Makan: Rp{" "}
                            {formatRupiah(item.total_meal_allowance)}
                          </span>

                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md w-fit">
                            Uang Bensin: Rp{" "}
                            {formatRupiah(item.total_fuel_allowance)}
                          </span>

                          {item.other_allowance > 0 && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md w-fit">
                              Lainnya: Rp {formatRupiah(item.other_allowance)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-semibold text-blue-600">
                        Rp {formatRupiah(item.net_salary)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/payroll-slip/${item.id}?print=true`}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                          Cetak PDF
                        </Link>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
