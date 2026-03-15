import { type ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "primary";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary"
}: ConfirmDialogProps) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-white via-blue-50/50 to-emerald-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl p-8 md:p-10 max-w-md w-full mx-4 shadow-2xl dark:shadow-gray-900/50 border-2 border-blue-200/50 dark:border-emerald-800/30 transform transition-all duration-300 scale-95 animate-scale-in">
        {/* Icon/Visual Element */}
        {confirmVariant === "danger" && (
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 flex items-center justify-center border-4 border-blue-300 dark:border-emerald-700 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Title */}
        <h3 className="text-2xl md:text-3xl font-bold mb-4 text-center bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
          {title}
        </h3>
        
        {/* Message */}
        <div className="mb-8 text-center text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
          {message}
        </div>
        
        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 text-gray-900 dark:text-gray-100 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg border border-gray-300 dark:border-gray-600"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 hover:from-blue-700 hover:via-cyan-700 hover:to-emerald-700 dark:from-blue-500 dark:via-cyan-500 dark:to-emerald-500 dark:hover:from-blue-600 dark:hover:via-cyan-600 dark:hover:to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

