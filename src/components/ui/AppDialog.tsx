import { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type DialogType = "success" | "error" | "warning" | "confirm";

interface DialogState {
  open: boolean;
  message: string;
  type: DialogType;
  onConfirm?: () => void;
}

const DialogContext = createContext<any>(null);

export function DialogProvider({ children }: any) {
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    message: "",
    type: "success",
  });

  const showDialog = (message: string, type: DialogType = "success") => {
    setDialog({
      open: true,
      message,
      type,
    });
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setDialog({
      open: true,
      message,
      type: "confirm",
      onConfirm,
    });
  };

  const closeDialog = () => {
    setDialog((prev) => ({ ...prev, open: false }));
  };

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    confirm: "bg-red-500",
  };

  const icons = {
    success: "✓",
    error: "✕",
    warning: "!",
    confirm: "?",
  };

  return (
    <DialogContext.Provider value={{ showDialog, showConfirm }}>
      {children}

      <AnimatePresence>
        {dialog.open && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/40 z-999"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl w-80 p-6 text-center space-y-4"
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{
                duration: 0.25,
                ease: "easeOut",
              }}
            >
              <div
                className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white ${colors[dialog.type]}`}
              >
                {icons[dialog.type]}
              </div>

              <p className="text-gray-700">{dialog.message}</p>

              {dialog.type === "confirm" ? (
                <div className="flex gap-3">
                  <button
                    onClick={closeDialog}
                    className="w-full border py-2 rounded-xl hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                      dialog.onConfirm?.();
                      closeDialog();
                    }}
                    className="w-full bg-red-500 text-white py-2 rounded-xl hover:bg-red-600"
                  >
                    Yes
                  </button>
                </div>
              ) : (
                <button
                  onClick={closeDialog}
                  className={`w-full   ${colors[dialog.type]} text-white py-2 rounded-xl`}
                >
                  OK
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}

export const useDialog = () => useContext(DialogContext);