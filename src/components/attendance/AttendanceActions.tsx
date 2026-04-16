export default function AttendanceActions({
  disabled,
  onCheckIn,
  loading,
}: any) {
  return (
    <button
      disabled={disabled || loading}
      onClick={onCheckIn}
      className="w-full bg-black text-white py-3 rounded-xl text-lg"
    >
      {loading ? "Memproses..." : "Absen Masuk"}
    </button>
  );
}