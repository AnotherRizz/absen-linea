import jsPDF from "jspdf";

export const generateLeaveRequestPdf = (data: any) => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();

  // Judul
  doc.setFontSize(16);
  doc.text("SURAT IZIN / CUTI KARYAWAN", pageWidth / 2, 20, {
    align: "center",
  });

  doc.setFontSize(11);

  const startY = 40;

  doc.text(`Nama Karyawan : ${data.employee_name}`, 20, startY);
  doc.text(`Jenis Izin    : ${data.leave_type}`, 20, startY + 10);
  doc.text(`Tanggal Mulai : ${data.start_date}`, 20, startY + 20);
  doc.text(`Tanggal Selesai : ${data.end_date}`, 20, startY + 30);
  doc.text(`Total Hari    : ${data.total_days} hari`, 20, startY + 40);

  doc.text("Alasan:", 20, startY + 55);

  doc.setFontSize(10);

  const splitReason = doc.splitTextToSize(data.reason || "-", 170);
  doc.text(splitReason, 20, startY + 65);

  // Tanda tangan
  const bottom = 200;

  doc.setFontSize(11);
  doc.text("Mengetahui,", 140, bottom);

  doc.text("HRD / Atasan", 140, bottom + 20);

  doc.save(`surat-izin-${data.employee_name}.pdf`);
};