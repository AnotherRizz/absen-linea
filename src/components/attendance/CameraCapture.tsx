import { useEffect, useRef, useState } from "react";

export default function CameraCapture({ setPhoto, location }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [preview, setPreview] = useState(false);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setPreview(true);
    } catch {
      alert("Kamera tidak dapat diakses");
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
      alert("Lokasi belum terdeteksi");
      return;
    }

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

      {preview ? (
        <video
          ref={videoRef}
          autoPlay
          className="rounded-md w-full"
          style={{ transform: "scaleX(-1)" }}
        />
      ) : (
        <div className="text-center p-6 bg-gray-100 rounded-md">
          Kamera dimatikan
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {preview ? (
        <button
          onClick={capture}
          disabled={!locationReady}
          className="w-full bg-blue-600 text-white py-3 rounded-xl disabled:bg-gray-400"
        >
          {locationReady ? "Ambil Foto" : "Menunggu Lokasi..."}
        </button>
      ) : (
        <button
          onClick={retry}
          className="w-full bg-gray-800 text-white py-3 rounded-xl"
        >
          Ulangi Foto
        </button>
      )}

    </div>
  );
}