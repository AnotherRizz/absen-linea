import * as XLSX from "xlsx";
import { formatDate, formatTime, formatMinutes } from "./timeFormatter";

export function exportAttendanceExcel(data: any[], dateRange: string[]) {

  if (!data.length) return;

  const start = formatDate(dateRange[0]);
  const end = formatDate(dateRange[1]);

  const rows = data.map((row, index) => ({
    No: index + 1,
    Tanggal: formatDate(row.date),
    Karyawan: row.employee,
    Status: row.status === "present" ? "Hadir" : "Tidak Hadir",
    "Jam Masuk": formatTime(row.check_in),
    "Jam Pulang": formatTime(row.check_out),
    "Total Jam Kerja": formatMinutes(row.work_minutes),
  }));

  const header = [
    ["LAPORAN ABSENSI KARYAWAN LINEA"],
    [`Periode: ${start} sampai ${end}`],
    [],
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.sheet_add_aoa(worksheet, header, { origin: "A1" });

  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 28 },
    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Absensi");

  const fileName =
    `laporan-absensi-${dateRange[0]}-sampai-${dateRange[1]}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}