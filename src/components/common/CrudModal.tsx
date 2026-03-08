// import { useEffect } from "react";

interface Props {
  open: boolean;
  title: string;
  value: string;
  setValue: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  loading?: boolean;
}

export default function CrudModal({
  open,
  title,
  value,
  setValue,
  onClose,
  onSubmit,
  loading,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/40">

      <div className="bg-white rounded-xl w-[400px] p-6 space-y-4">

        <h3 className="text-lg font-semibold">{title}</h3>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Name..."
        />

        <div className="flex justify-end gap-2">

          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Save
          </button>

        </div>

      </div>

    </div>
  );
}