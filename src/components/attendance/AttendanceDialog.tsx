import AttendanceContainer from "./AttendanceContainer";

export default function AttendanceDialog({ type, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-999">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 relative">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500"
        >
          ✕
        </button>

        <AttendanceContainer type={type} onSuccess={onClose} />
      </div>
    </div>
  );
}