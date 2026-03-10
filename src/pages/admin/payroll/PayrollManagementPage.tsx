import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { supabase } from "../../../services/supabaseClient";
import { useDialog } from "../../../components/ui/AppDialog";

interface PayrollBatch {
  id: string;
  month: number;
  year: number;
  total_employees: number;
  total_salary: number;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function PayrollManagementPage() {

  const navigate = useNavigate();
  const { showDialog, showConfirm } = useDialog();

  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [data, setData] = useState<PayrollBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchPayroll = async () => {

    try {

      setLoading(true);

      const { data, error } = await supabase
        .from("payroll_batches")
        .select("*")
        .eq("month", month)
        .eq("year", year);

      if (error) {
        showDialog("Gagal mengambil data payroll", "error");
        return;
      }

      setData(data || []);

    } catch {
      showDialog("Terjadi kesalahan", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [month, year]);

  const generatePayroll = () => {

    showConfirm(
      "Generate payroll untuk periode ini?",
      async () => {

        try {

          setGenerating(true);

          const { error } = await supabase.rpc("generate_payroll", {
            p_month: month,
            p_year: year,
          });

          if (error) {
            showDialog("Gagal generate payroll", "error");
            return;
          }

          await fetchPayroll();

          showDialog("Payroll berhasil digenerate", "success");

        } catch {
          showDialog("Terjadi kesalahan", "error");
        } finally {
          setGenerating(false);
        }
      }
    );
  };

  return (
    <div>

      <PageMeta title="Manajemen Payroll | HRIS" description="Payroll management" />
      <PageBreadcrumb pageTitle="Manajemen Payroll" />

      <div className="rounded-2xl border bg-white px-6 py-8 space-y-6">

        {/* FILTER */}

        <div className="flex items-end gap-4">

          <div>
            <label className="text-sm text-gray-500">Bulan</label>
            <input
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border px-3 py-2 rounded-lg w-24"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500">Tahun</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border px-3 py-2 rounded-lg w-32"
            />
          </div>

          <button
            onClick={generatePayroll}
            disabled={generating}
            className="bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600"
          >
            {generating ? "Generating..." : "Generate Payroll"}
          </button>

        </div>

        {/* TABLE */}

        <div className="border rounded-xl overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Bulan</th>
                <th className="px-4 py-3">Tahun</th>
                <th className="px-4 py-3">Jumlah Karyawan</th>
                <th className="px-4 py-3">Total Payroll</th>
                <th className="px-4 py-3">Detail</th>
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

              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400">
                    Payroll belum dibuat
                  </td>
                </tr>
              )}

              {!loading &&
                data.map((item) => (

                  <tr key={item.id} className="border-t hover:bg-gray-50">

                    <td className="px-4 py-3">{item.month}</td>

                    <td className="px-4 py-3">{item.year}</td>

                    <td className="px-4 py-3">{item.total_employees}</td>

                    <td className="px-4 py-3 font-medium">
                      Rp {formatRupiah(item.total_salary)}
                    </td>

                    <td className="px-4 py-3">

                      <button
                        onClick={() => navigate(`/payroll-detail/${item.id}`)}
                        className="text-blue-600 hover:underline"
                      >
                        Detail
                      </button>

                    </td>

                  </tr>
                ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}