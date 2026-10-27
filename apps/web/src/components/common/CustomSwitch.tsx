import React from 'react';

interface CustomSwitchProperties {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const CustomSwitch: React.FC<CustomSwitchProperties> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false
}) => {
  return (
    <label
      className={`inline-flex items-center gap-3 select-none ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
          checked ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-slate-800 border border-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col text-left">
          {label && <span className="text-xs font-semibold text-slate-200">{label}</span>}
          {description && <span className="text-[11px] text-slate-400">{description}</span>}
        </div>
      )}
    </label>
  );
};
