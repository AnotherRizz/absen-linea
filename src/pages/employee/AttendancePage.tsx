import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import AttendanceDialog from "../../components/attendance/AttendanceDialog";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { LogIn, LogOut, Clock } from "lucide-react";
import RealtimeClock from "../../components/attendance/RealtimeClock";
import FormatTime from "../../components/FormatTime";
import { formatMinutes, sumMinutes } from "../../utils/timeFormatter";
import { useDialog } from "../../components/ui/AppDialog";

export default function AttendancePage() {
 const { user} = useAuth();
 const employeeId = user?.employeeId;

  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState<"checkin" | "checkout" | null>(
    null,
  );
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);
  const [confirmCheckout, setConfirmCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { showDialog } = useDialog();

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
    setCheckoutLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      let address = "Alamat tidak ditemukan";
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        );
        const geo = await res.json();
        address = geo.display_name || address;
      } catch {
        // Use default address
      }

      const { error } = await supabase.rpc("attendance_checkout", {
        p_employee_id: employeeId,
        p_lat: lat,
        p_lng: lng,
        p_address: address,
      });

      if (error) throw error;

      showDialog("Check-out berhasil!", "success");
      setConfirmCheckout(false);
      fetchToday();
      fetchMonthly();
    } catch (err: any) {
      if (err?.code === 1) {
        showDialog("Akses lokasi ditolak. Silakan izinkan akses lokasi.", "error");
      } else if (err?.code === 2) {
        showDialog("Lokasi tidak tersedia. Pastikan GPS aktif.", "error");
      } else if (err?.code === 3) {
        showDialog("Timeout mendapatkan lokasi. Coba lagi.", "error");
      } else {
        showDialog(err?.message || "Gagal melakukan checkout", "error");
      }
    } finally {
      setCheckoutLoading(false);
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

      <div className="space-y-8">
        <div className="premium-card dark:border-gray-800 dark:bg-gray-900 py-8 space-y-6">
          {/* JAM REALTIME */}
          <RealtimeClock />

          {/* STATUS CARD */}
          <div className="px-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="section-title">
                Status Kehadiran
              </h2>

              <span
                className={`badge ${
                    todayRecord?.check_out
                      ? "badge-success"
                      : todayRecord?.check_in
                        ? "badge-info"
                        : "badge-neutral"
                  }`}>
                {statusLabel}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 p-5 shadow-lg">
                <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                <LogIn className="size-5 text-brand-200 mb-2" />
                <p className="text-brand-100 text-xs font-medium">Absen Masuk</p>
                <p className="font-bold text-white text-lg mt-1">
                  {todayRecord?.check_in ? (
                    <FormatTime value={todayRecord?.check_in} />
                  ) : (
                    "—"
                  )}
                </p>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 to-orange-500 p-5 shadow-lg">
                <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                <LogOut className="size-5 text-orange-200 mb-2" />
                <p className="text-orange-100 text-xs font-medium">Absen Pulang</p>
                <p className="font-bold text-white text-lg mt-1">
                  {todayRecord?.check_out ? (
                    <FormatTime value={todayRecord?.check_out} />
                  ) : (
                    "—"
                  )}
                </p>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-success-600 to-success-500 p-5 shadow-lg">
                <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                <Clock className="size-5 text-success-200 mb-2" />
                <p className="text-success-100 text-xs font-medium">Durasi Kerja</p>
                <p className="font-bold text-white text-lg mt-1">
                  {formatMinutes(todayRecord?.work_minutes)}
                </p>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setOpenDialog("checkin")}
           disabled={!!todayRecord?.check_in}
              className="btn-primary w-full py-3.5 rounded-2xl text-base">
              <LogIn className="size-5" />
              Absen Masuk
            </button>

            <button
              onClick={() => setConfirmCheckout(true)}
           disabled={!todayRecord?.check_in || todayRecord?.check_out}
              className="btn-secondary w-full py-3.5 rounded-2xl text-base dark:disabled:opacity-30">
              <LogOut className="size-5" />
              Absen Pulang
            </button>
          </div>
        </div>

        {/* ===== TABEL BULAN INI ===== */}
        <div className="premium-card dark:border-gray-800 dark:bg-gray-900 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="section-title">
              Riwayat Absensi Bulan Ini
            </h2>

            <span className="badge badge-info">
              {new Date().toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Ringkasan */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-success-50 dark:bg-success-500/10 p-4 border border-success-100 dark:border-success-500/20 transition-colors">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Hadir</p>
              <p className="font-bold text-success-700 dark:text-success-400 text-xl mt-1">
                {monthlyRecords.filter((r) => r.check_in).length} <span className="text-sm font-medium">Hari</span>
              </p>
            </div>

            <div className="rounded-2xl bg-brand-50 dark:bg-brand-500/10 p-4 border border-brand-100 dark:border-brand-500/20 transition-colors">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Selesai</p>
              <p className="font-bold text-brand-700 dark:text-brand-400 text-xl mt-1">
                {monthlyRecords.filter((r) => r.check_out).length} <span className="text-sm font-medium">Hari</span>
              </p>
            </div>

            <div className="rounded-2xl bg-warning-50 dark:bg-warning-500/10 p-4 border border-warning-100 dark:border-warning-500/20 transition-colors">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Jam Kerja</p>
              <p className="font-bold text-warning-700 dark:text-warning-400 text-xl mt-1">
                {formatMinutes(sumMinutes(monthlyRecords))}
              </p>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="premium-table">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th>Tanggal</th>
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
                        className="py-8 text-center text-gray-400 dark:text-gray-500">
                        Belum ada data bulan ini
                      </td>
                    </tr>
                  )}

                  {monthlyRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="whitespace-nowrap font-medium">
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

                      <td className="whitespace-nowrap">
                        {record.check_in ? (
                          <FormatTime value={record.check_in} />
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="whitespace-nowrap">
                        {record.check_out ? (
                          <FormatTime value={record.check_out} />
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="whitespace-nowrap">
                        {formatMinutes(record?.work_minutes)}
                      </td>

                      <td className="whitespace-nowrap">
                        <span
                          className={`badge ${
                    record.check_out
                      ? "badge-success"
                      : record.check_in
                        ? "badge-warning"
                        : "badge-danger"
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
              fetchMonthly();
            }}
          />
        )}
        {confirmCheckout && (
          <div className="dialog-backdrop">
            <div className="dialog-content p-8 w-96 space-y-5 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-warning-50 dark:bg-warning-500/15 flex items-center justify-center">
                <LogOut className="w-7 h-7 text-warning-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Konfirmasi Pulang</h3>

              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Apakah Anda yakin ingin melakukan absen pulang?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="btn-primary w-full">
                  {checkoutLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Konfirmasi"
                  )}
                </button>
                <button
                  onClick={() => setConfirmCheckout(false)}
                  disabled={checkoutLoading}
                  className="btn-secondary w-full">
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
