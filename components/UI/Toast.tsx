import React from 'react';
import { useToastStore, ToastMessage } from '@/stores/toastStore';
import { MOOD_STYLES } from '@/lib/moods';
import { X, CheckCircle, AlertCircle, Info, Globe } from 'lucide-react';

interface ToastProps {
  toast: ToastMessage;
}

const ToastItem: React.FC<ToastProps> = ({ toast }) => {
  const { dismissToast } = useToastStore();
  const { id, type, title, message, mood, country } = toast;

  // Style configurations based on type
  let icon = <Info className="h-5 w-5 text-blue-500" />;
  let wrapperClass = 'border-[#eae6db] bg-[#fbf9f4]/95 text-[#4a3e2e]';
  let accentBar = 'bg-blue-400';

  if (type === 'success') {
    icon = <CheckCircle className="h-5 w-5 text-[#7d9373]" />;
    wrapperClass = 'border-[#7d9373]/20 bg-[#fbf9f4]/95 text-[#4a3e2e]';
    accentBar = 'bg-[#7d9373]';
  } else if (type === 'error') {
    icon = <AlertCircle className="h-5 w-5 text-[#b87c7c]" />;
    wrapperClass = 'border-[#b87c7c]/20 bg-[#fbf9f4]/95 text-[#4a3e2e]';
    accentBar = 'bg-[#b87c7c]';
  } else if (type === 'info') {
    icon = <Info className="h-5 w-5 text-[#c9a96e]" />;
    wrapperClass = 'border-[#c9a96e]/20 bg-[#fbf9f4]/95 text-[#4a3e2e]';
    accentBar = 'bg-[#c9a96e]';
  } else if (type === 'mood' && mood) {
    const moodStyle = MOOD_STYLES[mood] || MOOD_STYLES.happy;
    icon = <span className="text-xl leading-none">{moodStyle.emoji}</span>;
    wrapperClass = `border-[rgba(201,169,110,0.15)] bg-[#fbf9f4]/95 text-[#4a3e2e] shadow-[0_8px_30px_rgba(74,62,46,0.08)]`;
    accentBar = `bg-gradient-to-b ${moodStyle.gradient}`;
  }

  return (
    <div
      className={`relative flex items-start gap-3 w-full max-w-sm overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-in font-mono ${wrapperClass}`}
      role="alert"
    >
      {/* Decorative vertical color accent bar */}
      <div className={`absolute top-0 left-0 bottom-0 w-[4px] ${accentBar}`} />

      {/* Icon */}
      <div className="flex-shrink-0 pt-0.5 pl-1">{icon}</div>

      {/* Content */}
      <div className="flex-1 space-y-1">
        {title && (
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#7d6c56]">
            {title}
          </div>
        )}
        {!title && country && (
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#7d6c56]">
            <Globe className="h-3 w-3 inline" />
            <span>Dropped in {country}</span>
          </div>
        )}
        <div className="text-xs font-medium leading-relaxed">{message}</div>
      </div>

      {/* Close button */}
      <button
        onClick={() => dismissToast(id)}
        className="flex-shrink-0 rounded-lg p-0.5 text-[#a3907a] hover:bg-[#eae6db] hover:text-[#4a3e2e] transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 w-full max-w-sm px-4 md:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
