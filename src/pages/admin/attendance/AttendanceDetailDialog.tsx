import { useEffect, useState } from "react";
import { supabase } from "../../../services/supabaseClient";
import {
  formatDate,
  formatTime,
  formatMinutes,
} from "../../../utils/timeFormatter";
import { X, MapPin, Clock, User, Calendar } from "lucide-react";

interface AttendanceDetail {
  id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  check_in_address: string | null;
  check_out_address: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  late_minutes: number;
  work_minutes: number;
  status: string;
  attachment: string | null;
  notes: string | null;
  employees: {
    full_name: string;
  } | null;
}

interface Props {
  attendanceId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function AttendanceDetailDialog({
  attendanceId,
  open,
  onClose,
}: Props) {
  const [data, setData] = useState<AttendanceDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAttendance = async () => {
    if (!attendanceId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("attendance_records")
      .select(
        `
        *,
        employees:employee_id (
          full_name
        )
      `,
      )
      .eq("id", attendanceId)
      .single();

    if (!error) {
      setData(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchAttendance();
  }, [attendanceId, open]);

  if (!open) return null;

  const attachmentUrl = data?.attachment
    ? supabase.storage.from("attendance-photos").getPublicUrl(data.attachment)
        .data.publicUrl
    : null;

  return (
    <div className="dialog-backdrop">
      <div className="dialog-content p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Detail Absensi
            </h2>
            {!loading && data && (
              <p className="text-sm text-brand-500 font-medium mt-0.5">{data.employees?.full_name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
            Memuat data...
          </div>
        )}

        {!loading && data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="grid grid-cols-2 gap-5">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <p className="field-label">Nama Karyawan</p>
                </div>
                <p className="field-value">{data.employees?.full_name}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <p className="field-label">Hari & Tanggal</p>
                </div>
                <p className="field-value">{formatDate(data.attendance_date)}</p>
              </div>
              <div className="space-y-1">
                <p className="field-label">Absen Masuk</p>
                <p className="field-value">{formatTime(data.check_in)}</p>
                {data.check_in_address && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 flex items-start gap-1 mt-1">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    {data.check_in_address}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <p className="field-label">Absen Pulang</p>
                <p className="field-value">{formatTime(data.check_out)}</p>
                {data.check_out_address && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 flex items-start gap-1 mt-1">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    {data.check_out_address}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <p className="field-label">Terlambat</p>
                </div>
                <p className="field-value">{formatMinutes(data.late_minutes)}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <p className="field-label">Jam Kerja</p>
                </div>
                <p className="field-value">{formatMinutes(data.work_minutes)}</p>
              </div>

              <div className="space-y-1">
                <p className="field-label">Status</p>
                <span className="badge badge-success capitalize">{data.status}</span>
              </div>

              <div className="space-y-1">
                <p className="field-label">Keterangan</p>
                <p className="field-value">{data.notes || "Tidak Ada Keterangan"}</p>
              </div>
            </section>

            {attachmentUrl && (
              <div>
                <p className="field-label mb-3">Foto Absensi</p>

                <img
                  src={attachmentUrl}
                  alt="attendance"
                  className="rounded-xl border border-gray-200 dark:border-gray-700 w-full max-h-[300px] object-contain shadow-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
