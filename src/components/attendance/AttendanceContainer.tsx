import { useEffect, useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import CameraCapture from "./CameraCapture";
import { useDialog } from "../../components/ui/AppDialog";

export default function AttendanceContainer({ type, onSuccess }: any) {
  const { user } = useAuth();

  const [location, setLocation] = useState<any>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"camera" | "notes">("camera");
  const [loading, setLoading] = useState(false);
const { showDialog } = useDialog();
  const [employeeId, setEmployeeId] = useState<string | null>(null);


useEffect(() => {
  if (!user?.id) return;

  const fetchEmployeeId = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (error) {
      showDialog("Gagal mengambil data karyawan", "error");
      return;
    }

    if (!data) {
      showDialog("Data karyawan tidak ditemukan", "error");
      return;
    }

    setEmployeeId(data.id);
  };

  fetchEmployeeId();
}, [user]);

  // lokasi hanya diambil saat dialog buka
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );

    const data = await res.json();

    setLocation({
      latitude: lat,
      longitude: lng,
      address: data.display_name,
    });
  } catch {
    setLocation({
      latitude: lat,
      longitude: lng,
      address: "Alamat tidak ditemukan",
    });
  }
});
  }, []);

 const getJakartaNow = () => {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    })
  );
};

const formatFolderDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

const handleSubmit = async () => {
  if (!employeeId) {
    showDialog("Data karyawan belum siap", "error");
    return;
  }

  if (!photo) {
    showDialog("Foto belum diambil", "error");
    return;
  }

  if (!location) {
    showDialog("Lokasi belum tersedia", "error");
    return;
  }

  setLoading(true);

  try {
    const jakartaNow = getJakartaNow();
    const folderDate = formatFolderDate(jakartaNow);

    const { data: emp } = await supabase
      .from("employees")
      .select("full_name")
      .eq("id", employeeId)
      .single();

    const employeeName = emp?.full_name || "unknown";

    const safeName = employeeName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase();

    const timeStamp = `${jakartaNow
      .getHours()
      .toString()
      .padStart(2, "0")}-${jakartaNow
      .getMinutes()
      .toString()
      .padStart(2, "0")}-${jakartaNow
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;

    const filePath = `${folderDate}/${safeName}-${timeStamp}.jpg`;

    // Upload dulu ke storage
    const { error: uploadError } = await supabase.storage
      .from("attendance-photos")
      .upload(filePath, photo, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 🔥 Gunakan RPC
    if (type === "checkin") {
      const { error } = await supabase.rpc("attendance_checkin", {
        p_employee_id: employeeId,
        p_lat: location.latitude,
        p_lng: location.longitude,
        p_address: location.address,
        p_notes: notes,
        p_attachment: filePath,
      });

      if (error) throw error;
    } else {
      const { error } = await supabase.rpc("attendance_checkout", {
        p_employee_id: employeeId,
        p_lat: location.latitude,
        p_lng: location.longitude,
        p_address: location.address,
      });

      if (error) throw error;
    }

    showDialog(
      type === "checkin"
        ? "Check-in berhasil"
        : "Check-out berhasil",
      "success"
    );

    onSuccess();
  } catch (err: any) {
    showDialog(err.message || "Terjadi kesalahan", "error");
  }

  setLoading(false);
};
  return (
    <div className="space-y-4">

      <h3 className="text-lg font-semibold text-center">
        {type === "checkin" ? "Check In" : "Check Out"}
      </h3>

      {step === "camera" && (
        <CameraCapture
          location={location}
          setPhoto={(file: File) => {
            setPhoto(file);
            setStep("notes");
          }}
        />
      )}

      {step === "notes" && (
        <>
          {photo && (
            <img
              src={URL.createObjectURL(photo)}
              className="rounded-2xl w-full"
            />
          )}

          <textarea
            placeholder="Tambahkan catatan (opsional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded-2xl p-3"
          />

          <div className="flex gap-3">
            <button
              onClick={() => setStep("camera")}
              className="w-full border py-2 rounded-xl"
            >
              Ulangi Foto
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-black text-white py-2 rounded-xl"
            >
              {loading ? "Memproses..." : "Submit"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}