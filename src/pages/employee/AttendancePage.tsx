import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import AttendanceDialog from "../../components/attendance/AttendanceDialog";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { TimeIcon } from "../../icons";
import { SquareDashedMousePointerIcon } from "lucide-react";
import RealtimeClock from "../../components/attendance/RealtimeClock";
import FormatTime from "../../components/FormatTime";
import { formatMinutes, sumMinutes } from "../../utils/timeFormatter";

export default function AttendancePage() {
  const { employeeId } = useAuth();

  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState<"checkin" | "checkout" | null>(
    null,
  );
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);
  const [confirmCheckout, setConfirmCheckout] = useState(false);

  useEffect(() => {
    if (employeeId) fetchToday();
  }, [employeeId]);

  useEffect(() => {
    if (employeeId) fetchMonthly();
  }, [employeeId]);

  const fetchMonthly = async () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const { data } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("attendance_date", firstDay)
      .lte("attendance_date", lastDay)
      .order("attendance_date", { ascending: false });

    setMonthlyRecords(data || []);
  };
  const handleCheckout = async () => {
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        );

        const geo = await res.json();

        const { error } = await supabase.rpc("attendance_checkout", {
          p_employee_id: employeeId,
          p_lat: lat,
          p_lng: lng,
          p_address: geo.display_name,
        });

        if (error) throw error;

        setConfirmCheckout(false);
        fetchToday();
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchToday = async () => {
 const today = new Date().toLocaleDateString("en-CA");

    const { data } = await supabase
  .from("attendance_records")
  .select("*")
  .eq("employee_id", employeeId)
  .eq("attendance_date", today)
  .maybeSingle();

    setTodayRecord(data);
  };

  const statusLabel = todayRecord?.check_out
    ? "Selesai"
    : todayRecord?.check_in
      ? "Sedang Bekerja"
      : "Belum Check In";

  return (
    <>
      <PageMeta
        title="Absensi Saya"
        description="Absensi harian karyawan dengan fitur foto dan lokasi"
      />
      <PageBreadcrumb pageTitle="Absensi Saya" />

      <div className="min-h-screen px-6 py-10">
        <div className="max-w-6xl bg-white dark:bg-gray-900 rounded-3xl shadow-lg py-5 mx-auto space-y-2">
          {/* JAM REALTIME */}
          <RealtimeClock />

          {/* STATUS CARD */}
          <div className=" p-6 space-y-2 ">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Status Kehadiran
              </h2>

              <span
                className={`px-3 py-1 rounded-full text-xs font-medium
                  ${
                    todayRecord?.check_out
                      ? "bg-emerald-100 text-emerald-700"
                      : todayRecord?.check_in
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-600"
                  }`}>
                {statusLabel}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className=" bg-gradient-to-r from-blue-600 to-blue-400 overflow-hidden relative rounded-2xl p-4">
                <SquareDashedMousePointerIcon className=" size-20 text-blue-300 absolute -top-4 right-0" />
                <p className="text-gray-50">Absen Masuk</p>
                <p className="font-semibold text-gray-200">
                  {todayRecord?.check_in ? (
                    <FormatTime value={todayRecord?.check_in} />
                  ) : (
                    "-"
                  )}
                </p>
              </div>

              <div className=" bg-gradient-to-r from-orange-600 to-orange-400 overflow-hidden relative rounded-2xl p-4">
                <SquareDashedMousePointerIcon className=" rotate-90 size-20 text-orange-300 absolute -top-4 right-0" />
                <p className="text-gray-50">Absen Pulang</p>
                <p className="font-semibold text-gray-200">
                  {todayRecord?.check_out ? (
                    <FormatTime value={todayRecord?.check_out} />
                  ) : (
                    "-"
                  )}
                </p>
              </div>

              <div className=" bg-gradient-to-r from-green-600 to-green-400 overflow-hidden relative rounded-2xl p-4">
                <TimeIcon className=" size-20 text-green-300 absolute -top-4 right-0" />
                <p className="text-green-100">Durasi Kerja</p>
                <p className="font-semibold text-green-200">
                  {formatMinutes(todayRecord?.work_minutes)}
                </p>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 p-6">
            <button
              onClick={() => setOpenDialog("checkin")}
           disabled={!!todayRecord?.check_in}
              className="w-full py-3 rounded-2xl font-semibold text-white
                bg-black hover:bg-black transition disabled:bg-gray-400 disabled:cursor-not-allowed">
              Absen Masuk
            </button>

            <button
              onClick={() => setConfirmCheckout(true)}
           disabled={!todayRecord?.check_in || todayRecord?.check_out}
              className="w-full py-3 rounded-2xl font-semibold text-white
                bg-black hover:bg-black transition disabled:bg-gray-400 disabled:cursor-not-allowed">
              Absen Pulang
            </button>
          </div>
        </div>
        {/* ===== TABEL BULAN INI ===== */}
        <div className="max-w-6xl bg-white dark:bg-gray-900 transition-colors rounded-3xl shadow-lg p-6 mx-auto mt-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              Riwayat Absensi Bulan Ini
            </h2>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Ringkasan */}
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 transition-colors rounded-2xl p-4">
              <p className="text-gray-500 dark:text-gray-400">Total Hadir</p>
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                {monthlyRecords.filter((r) => r.check_in).length} Hari
              </p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/30 transition-colors rounded-2xl p-4">
              <p className="text-gray-500 dark:text-gray-400">Total Selesai</p>
              <p className="font-semibold text-indigo-700 dark:text-indigo-300">
                {monthlyRecords.filter((r) => r.check_out).length} Hari
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/30 transition-colors rounded-2xl p-4">
              <p className="text-gray-500 dark:text-gray-400">
                Total Jam Kerja
              </p>
              <p className="font-semibold text-orange-800 dark:text-orange-300">
                {formatMinutes(sumMinutes(monthlyRecords))}
              </p>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="min-w-[700px] w-full text-sm text-left border-collapse">
                <thead className="sticky top-0 bg-white dark:bg-gray-900 transition-colors z-10">
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    <th className="py-3">Tanggal</th>
                    <th>Masuk</th>
                    <th>Pulang</th>
                    <th>Jam Kerja</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {monthlyRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-gray-400 dark:text-gray-500">
                        Belum ada data bulan ini
                      </td>
                    </tr>
                  )}

                  {monthlyRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="py-3 whitespace-nowrap text-gray-700 dark:text-gray-200">
                        {new Date(record.attendance_date).toLocaleDateString(
                          "id-ID",
                          {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </td>

                      <td className="whitespace-nowrap text-gray-700 dark:text-gray-200">
                        {record.check_in ? (
                          <FormatTime value={record.check_in} />
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="whitespace-nowrap text-gray-700 dark:text-gray-200">
                        {record.check_out ? (
                          <FormatTime value={record.check_out} />
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="whitespace-nowrap text-gray-700 dark:text-gray-200">
                        {formatMinutes(record?.work_minutes)}
                      </td>

                      <td className="whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium
                  ${
                    record.check_out
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : record.check_in
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                        : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
                  }`}>
                          {record.check_out
                            ? "Selesai"
                            : record.check_in
                              ? "Tidak Absen Pulang"
                              : "Tidak Hadir"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {openDialog && (
          <AttendanceDialog
            type={openDialog}
            onClose={() => {
              setOpenDialog(null);
              fetchToday();
            }}
          />
        )}
        {confirmCheckout && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-999">
            <div className="bg-white rounded-2xl p-6 w-80 space-y-4 text-center">
              <h3 className="text-lg font-semibold">Konfirmasi Pulang</h3>

              <p className="text-gray-500 text-sm">
                Apakah Anda yakin ingin melakukan absen pulang?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-500 text-white py-2 rounded-xl">
                  Konfirmasi
                </button>
                <button
                  onClick={() => setConfirmCheckout(false)}
                  className="w-full border py-2 rounded-xl">
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
