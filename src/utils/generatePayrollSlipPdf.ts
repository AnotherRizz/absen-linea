import jsPDF from "jspdf";

interface SlipData {
  employee_name: string;
  basic_salary: number;
  total_meal_allowance: number;
  total_fuel_allowance: number;
  other_allowance: number;
  total_deduction: number;
  net_salary: number;
  total_work_days: number;
  total_leave_days: number;
  total_absent_days: number;
  month: number;
  year: number;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

const getMonthName = (month: number) =>
  new Date(2000, month - 1).toLocaleString("id-ID", { month: "long" });

export function generatePayrollSlipPdf(data: SlipData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ============ HEADER ============
  doc.setFillColor(37, 99, 235); // brand blue
  doc.rect(0, 0, pageWidth, 36, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("SLIP GAJI KARYAWAN", pageWidth / 2, 16, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Periode: ${getMonthName(data.month)} ${data.year}`,
    pageWidth / 2,
    26,
    { align: "center" }
  );

  doc.setFontSize(7);
  doc.text(
    `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    pageWidth / 2,
    33,
    { align: "center" }
  );

  // ============ EMPLOYEE INFO ============
  doc.setTextColor(0, 0, 0);
  let y = 48;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Nama Karyawan", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(`: ${data.employee_name}`, 70, y);

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Periode", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(`: ${getMonthName(data.month)} ${data.year}`, 70, y);

  // ============ ATTENDANCE SUMMARY ============
  y += 14;

  // Box backgrounds
  const boxWidth = (pageWidth - 50) / 3;
  const boxHeight = 22;

  // Work days box
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(20, y, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Hari Kerja", 20 + boxWidth / 2, y + 8, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.setFont("helvetica", "bold");
  doc.text(String(data.total_work_days), 20 + boxWidth / 2, y + 18, {
    align: "center",
  });

  // Leave days box
  const box2x = 25 + boxWidth;
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(box2x, y, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Hari Cuti", box2x + boxWidth / 2, y + 8, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(217, 119, 6);
  doc.setFont("helvetica", "bold");
  doc.text(String(data.total_leave_days), box2x + boxWidth / 2, y + 18, {
    align: "center",
  });

  // Absent days box
  const box3x = 30 + boxWidth * 2;
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(box3x, y, boxWidth, boxHeight, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Hari Absen", box3x + boxWidth / 2, y + 8, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(data.total_absent_days > 0 ? 220 : 0, data.total_absent_days > 0 ? 38 : 0, data.total_absent_days > 0 ? 38 : 0);
  doc.setFont("helvetica", "bold");
  doc.text(String(data.total_absent_days), box3x + boxWidth / 2, y + 18, {
    align: "center",
  });

  // ============ LINE ============
  y += boxHeight + 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, pageWidth - 20, y);

  // ============ PENDAPATAN ============
  y += 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("PENDAPATAN", 20, y);

  y += 8;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const drawRow = (label: string, value: string, yPos: number, bold = false) => {
    if (bold) {
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    doc.text(label, 25, yPos);
    doc.text(value, pageWidth - 25, yPos, { align: "right" });
  };

  drawRow("Gaji Pokok", `Rp ${formatRupiah(data.basic_salary)}`, y);
  y += 7;
  drawRow("Tunjangan Makan", `Rp ${formatRupiah(data.total_meal_allowance)}`, y);
  y += 7;
  drawRow("Tunjangan Bensin", `Rp ${formatRupiah(data.total_fuel_allowance)}`, y);
  y += 7;
  drawRow("Tunjangan Lain", `Rp ${formatRupiah(data.other_allowance)}`, y);

  // Total Pendapatan
  y += 3;
  doc.setDrawColor(200, 200, 200);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(25, y, pageWidth - 25, y);
  doc.setLineDashPattern([], 0);
  y += 7;

  const totalAllowance =
    data.total_meal_allowance + data.total_fuel_allowance + data.other_allowance;
  const grossSalary = data.basic_salary + totalAllowance;

  drawRow("Total Pendapatan", `Rp ${formatRupiah(grossSalary)}`, y, true);

  // ============ POTONGAN ============
  y += 12;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("POTONGAN", 20, y);

  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  if (data.total_deduction > 0) {
    doc.setTextColor(220, 38, 38);
  }
  drawRow(
    "Potongan Absen",
    `${data.total_deduction > 0 ? "-" : ""}Rp ${formatRupiah(data.total_deduction)}`,
    y
  );
  doc.setTextColor(0, 0, 0);

  // ============ GAJI BERSIH ============
  y += 10;
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  y += 2;
  doc.line(20, y, pageWidth - 20, y);
  doc.setLineWidth(0.2);

  y += 10;
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(20, y - 5, pageWidth - 40, 16, 3, 3, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text("GAJI BERSIH", 25, y + 5);
  doc.text(`Rp ${formatRupiah(data.net_salary)}`, pageWidth - 25, y + 5, {
    align: "right",
  });

  // ============ FOOTER ============
  y += 30;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Slip gaji ini diterbitkan secara elektronik dan sah tanpa tanda tangan.",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  // Save
  const safeName = data.employee_name
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();
  doc.save(
    `slip-gaji-${safeName}-${getMonthName(data.month).toLowerCase()}-${data.year}.pdf`
  );
}
