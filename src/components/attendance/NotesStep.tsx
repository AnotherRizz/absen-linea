export default function NotesStep({
  notes,
  setNotes,
  onSubmit,
  loading,
}: any) {
  return (
    <div className="space-y-4">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Tambahkan catatan (opsional)"
        className="w-full border rounded-xl p-3"
      />

      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-xl"
      >
        {loading ? "Memproses..." : "Submit Absensi"}
      </button>
    </div>
  );
}