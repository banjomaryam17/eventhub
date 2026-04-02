"use client";

interface ModalConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
}

interface ConfirmModalProps {
  config: ModalConfig | null;
  onClose: () => void;
}

export default function ConfirmModal({ config, onClose }: ConfirmModalProps) {
  if (!config) return null;

  const variant = config.variant ?? "danger";

  const variantStyles = {
    danger: {
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      iconBg: "bg-red-500/10 border border-red-500/20",
      button: "bg-red-600 hover:bg-red-500 text-white",
    },
    warning: {
      icon: (
        <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: "bg-amber-500/10 border border-amber-500/20",
      button: "bg-amber-600 hover:bg-amber-500 text-white",
    },
    info: {
      icon: (
        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: "bg-indigo-500/10 border border-indigo-500/20",
      button: "bg-indigo-600 hover:bg-indigo-500 text-white",
    },
  };

  const styles = variantStyles[variant];

   function handleConfirm() {
    if (!config) return;
    config.onConfirm();
    onClose();
}

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + Title */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}>
            {styles.icon}
          </div>
          <h3 className="text-base font-bold text-white">{config.title}</h3>
        </div>

        {/* Message */}
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          {config.message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-white px-4 py-2 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors"
          >
            {config.cancelLabel ?? "Cancel"}
          </button>
          <button
            onClick={handleConfirm}
            className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${styles.button}`}
          >
            {config.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
