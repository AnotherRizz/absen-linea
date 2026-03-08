import { X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

export default function Toast({
  message,
  type = "info",
  onClose,
}: ToastProps) {
  const baseStyle =
    "flex items-center justify-between px-4 py-3 rounded-lg shadow-md text-sm min-w-[280px]";

  const typeStyle = {
    success: "bg-green-100 text-green-800 border border-green-300",
    error: "bg-red-100 text-red-800 border border-red-300",
    info: "bg-blue-100 text-blue-800 border border-blue-300",
  };

  return (
    <div className={`${baseStyle} ${typeStyle[type]}`}>
      <span>{message}</span>
      <button onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}