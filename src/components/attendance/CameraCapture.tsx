import { useEffect, useRef, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";

export default function CameraCapture({ setPhoto, location }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [preview, setPreview] = useState(true); // Start with video element visible
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setCameraReady(false);
    setPreview(true); // Ensure video element is in DOM

    // Small delay to ensure video element is mounted
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(
          "Browser tidak mendukung akses kamera. Pastikan Anda menggunakan HTTPS dan browser yang mendukung."
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready before marking as ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            ?.play()
            .then(() => {
              setCameraReady(true);
            })
            .catch((playErr) => {
              console.error("Video play error:", playErr);
              setError(
                "Kamera berhasil diakses tapi video gagal dimainkan. Coba refresh halaman."
              );
            });
        };
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setPreview(false);
      if (err.name === "NotAllowedError") {
        setError(
          "Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda."
        );
      } else if (err.name === "NotFoundError") {
        setError("Kamera tidak ditemukan pada perangkat ini.");
      } else if (err.name === "NotReadableError") {
        setError(
          "Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain dan coba lagi."
        );
      } else if (err.name === "OverconstrainedError") {
        // Retry without constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            setPreview(true);
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(() => setCameraReady(true));
            };
          }
        } catch {
          setError(
            "Kamera tidak dapat diakses. Pastikan tidak ada aplikasi lain yang menggunakan kamera."
          );
        }
      } else {
        setError(
          `Kamera tidak dapat diakses (${err.name}). Pastikan tidak ada aplikasi lain yang menggunakan kamera.`
        );
      }
    }
  }, []);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

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
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="rounded-2xl w-full border border-gray-200 dark:border-gray-700"
            style={{ transform: "scaleX(-1)" }}
          />
          {!cameraReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Memuat kamera...
              </div>
            </div>
          )}
        </div>
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
          disabled={!locationReady || !cameraReady}
          className="btn-primary w-full py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!cameraReady
            ? " Memuat Kamera..."
            : locationReady
            ? " Ambil Foto"
            : " Menunggu Lokasi..."}
        </button>
      ) : (
        <button
          onClick={retry}
          className="btn-secondary w-full py-3 rounded-xl"
        >
           Ulangi Foto
        </button>
      )}

    </div>
  );
}