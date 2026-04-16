import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function CameraCapture({ setPhoto, location }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setPreview(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.");
      } else if (err.name === "NotFoundError") {
        setError("Kamera tidak ditemukan pada perangkat ini.");
      } else {
        setError("Kamera tidak dapat diakses. Pastikan tidak ada aplikasi lain yang menggunakan kamera.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const capture = () => {
    if (!location || !location.latitude || !location.longitude) {
      setError("Lokasi belum terdeteksi. Pastikan GPS aktif dan izin lokasi diberikan.");
      return;
    }

    setError(null);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, canvas.height - 90, canvas.width, 90);

    ctx.fillStyle = "white";
    ctx.font = "18px sans-serif";

    const now = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
    });

    const text1 = now;
    const text2 = `Lat ${location.latitude}, Lng ${location.longitude}`;
    const text3 = location.address || "";

    ctx.fillText(text1, 20, canvas.height - 60);
    ctx.fillText(text2, 20, canvas.height - 40);
    ctx.fillText(text3, 20, canvas.height - 20);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], "selfie.jpg", {
        type: "image/jpeg",
      });

      setPhoto(file);

      stopCamera();
      setPreview(false);
    }, "image/jpeg");
  };

  const retry = () => {
    startCamera();
  };

  const locationReady =
    location && location.latitude && location.longitude;

  return (
    <div className="space-y-4">

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20">
          <AlertTriangle className="w-4 h-4 text-error-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
        </div>
      )}

      {preview ? (
        <video
          ref={videoRef}
          autoPlay
          className="rounded-2xl w-full border border-gray-200 dark:border-gray-700"
          style={{ transform: "scaleX(-1)" }}
        />
      ) : (
        !error && (
          <div className="text-center p-6 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500 dark:text-gray-400">
            Kamera dimatikan
          </div>
        )
      )}

      <canvas ref={canvasRef} className="hidden" />

      {preview ? (
        <button
          onClick={capture}
          disabled={!locationReady}
          className="btn-primary w-full py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {locationReady ? "📸 Ambil Foto" : "⏳ Menunggu Lokasi..."}
        </button>
      ) : (
        <button
          onClick={retry}
          className="btn-secondary w-full py-3 rounded-xl"
        >
          🔄 Ulangi Foto
        </button>
      )}

    </div>
  );
}