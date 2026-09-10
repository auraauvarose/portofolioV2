"use client";

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  required?: boolean;
};

export default function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  required,
}: FieldProps) {
  const base =
    "w-full rounded-md border border-white/10 bg-transparent px-3 py-2.5 text-sm text-white outline-none transition-colors duration-300 placeholder:text-gray-600 hover:border-white/30 focus:border-accent";
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-gray-400">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={base}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </label>
  );
}
