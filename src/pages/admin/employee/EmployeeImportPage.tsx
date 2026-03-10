import { useState } from "react";
import { UploadCloud, Download, Loader2 } from "lucide-react";

import {
  parseEmployeeExcel,
  prepareEmployeeImport,
  createEmployeeWithAuth,
} from "../../../services/employeeImportService";

import { useDialog } from "../../../components/ui/AppDialog";

export default function EmployeeImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const { showDialog } = useDialog();

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".xlsx")) {
      showDialog("File harus format Excel (.xlsx)", "error");
      return;
    }

    setFile(file);
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const rawRows = await parseEmployeeExcel(file);
      const { rows, errors } = await prepareEmployeeImport(rawRows);

      if (errors.length > 0) {
        const errorText = errors
          .map((e) => `Baris ${e.row}: ${e.errors.join(", ")}`)
          .join("\n");

        showDialog(`Import gagal.\n\n${errorText}`, "error");
        setLoading(false);
        return;
      }

      for (const row of rows) {
        try {
          await createEmployeeWithAuth(row);
        } catch (err) {
          console.error("IMPORT ERROR:", row.email, err);
          throw err;
        }
      }

      showDialog("Import data karyawan berhasil.", "success");
      setFile(null);
    } catch (err: any) {
      showDialog(err.message || "Import gagal.", "error");
    }

    setLoading(false);
  };

  const downloadTemplate = () => {
    window.open("/templates/template_import_karyawan.xlsx");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="p-6 bg-white rounded-2xl border">
        <h2 className="text-xl font-semibold">Import Data Karyawan</h2>

        <p className="text-gray-400 text-sm mb-4">
          Download template lalu upload file Excel untuk menambahkan data
          karyawan
        </p>

        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
          <Download size={18} />
          Download Template
        </button>
      </div>

      {/* UPLOAD AREA */}
      <div className="p-8 bg-white border rounded-2xl">
        <div
          className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 transition"
          onClick={() => document.getElementById("excelUpload")?.click()}>
          <UploadCloud className="mx-auto mb-3 text-gray-400" size={36} />

          <p className="font-medium">Upload atau Drop File Excel</p>

          <p className="text-sm text-gray-400">Format file .xlsx</p>

          {file && <p className="mt-3 text-sm text-blue-600">{file.name}</p>}
        </div>

        <input
          id="excelUpload"
          type="file"
          accept=".xlsx"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {file && (
          <button
            onClick={handleImport}
            disabled={loading}
            className="mt-6 px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? "Mengimport..." : "Import Data"}
          </button>
        )}
      </div>

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-999">
          <div className="bg-white rounded-2xl p-6 flex items-center gap-3 shadow-lg">
            <Loader2 className="animate-spin text-blue-600" size={24} />
            <span className="text-gray-700">Memproses import data...</span>
          </div>
        </div>
      )}
    </div>
  );
}
