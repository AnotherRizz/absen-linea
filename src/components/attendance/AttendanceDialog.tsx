import AttendanceContainer from "./AttendanceContainer";

export default function AttendanceDialog({ type, onClose }: any) {
  return (
    <div className="dialog-backdrop">
      <div className="dialog-content w-full max-w-md p-6 relative">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          ✕
        </button>

        <AttendanceContainer type={type} onSuccess={onClose} />
      </div>
    </div>
  );
}