import { useEffect, useState } from "react";
import { supabase } from "../../../services/supabaseClient";
import {
  formatDate,
  formatTime,
  formatMinutes,
} from "../../../utils/timeFormatter";

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
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl md:max-w-6xl p-6 shadow-lg">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Detail Absensi{" "}
            <span className=" text-blue-500">
              {!loading && data && data.employees?.full_name}
            </span>{" "}
          </h2>
          <button onClick={onClose} className="text-gray-500">
            ✕
          </button>
        </div>

        {loading && <p>Loading...</p>}

        {!loading && data && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <section className="space-y-4 grid grid-cols-2 gap-5">
                <div>
                  <p className="text-sm text-gray-500">Nama Karyawan</p>
                  <p className="font-medium">{data.employees?.full_name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Hari & Tanggal</p>
                  <p>{formatDate(data.attendance_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Absen Masuk</p>
                  <p>{formatTime(data.check_in)}</p>
                  <p className="text-xs text-gray-500">
                    {data.check_in_address}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Absen Pulang</p>
                  <p>{formatTime(data.check_out)}</p>
                  <p className="text-xs text-gray-500">
                    {data.check_out_address}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Terlambat</p>
                  <p>{formatMinutes(data.late_minutes)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Jam Kerja</p>
                  <p>{formatMinutes(data.work_minutes)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="capitalize px-2 py-1 bg-green-600 w-fit text-xs text-white rounded-full">{data.status}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Keterangan</p>
                  <p>{data.notes || "Tidak Ada Keterangan"}</p>
                </div>
              </section>

              {attachmentUrl && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Foto Absensi</p>

                  <img
                    src={attachmentUrl}
                    alt="attendance"
                    className="rounded-lg border w-full max-h-[300px] object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
