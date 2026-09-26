"use client";

import type { ComponentType, ReactNode } from "react";
import { AlertIcon, CheckIcon, InfoIcon } from "@/components/admin/icons";

type ButtonVariant = "primary" | "ghost" | "quiet" | "danger";

export function Button({
  variant = "ghost",
  icon: Icon,
  children,
  className = "",
  type = "button",
  ...rest
}: {
  variant?: ButtonVariant;
  icon?: ComponentType<{ className?: string }>;
  children?: ReactNode;
  className?: string;
  type?: "button" | "submit";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variantClass = {
    primary: "a-btn-primary",
    ghost: "a-btn-ghost",
    quiet: "a-btn-quiet",
    danger: "a-btn-ghost a-btn-danger",
  }[variant];

  return (
    <button
      type={type}
      className={`a-btn ${variantClass} ${className}`}
      {...rest}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

export function IconButton({
  icon: Icon,
  label,
  danger = false,
  className = "",
  ...rest
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  danger?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`a-icon-btn ${danger ? "a-icon-btn-danger" : ""} ${className}`}
      {...rest}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export type ChipTone = "neutral" | "accent" | "ok" | "warn";

export function Chip({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: ChipTone;
  children: ReactNode;
  className?: string;
}) {
  return <span className={`a-chip a-chip-${tone} ${className}`}>{children}</span>;
}

export function PanelHeader({
  title,
  description,
  meta,
  actions,
}: {
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 border-b border-[var(--color-a-line)] pb-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="text-display text-xl uppercase text-[var(--color-a-text)]">
              {title}
            </h2>
            {meta}
          </div>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-a-dim)]">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

type NoticeTone = "ok" | "error" | "info" | "warn";

const NOTICE_ICON: Record<NoticeTone, ComponentType<{ className?: string }>> = {
  ok: CheckIcon,
  error: AlertIcon,
  warn: AlertIcon,
  info: InfoIcon,
};

const NOTICE_COLOR: Record<NoticeTone, string> = {
  ok: "var(--color-a-ok)",
  error: "var(--color-a-danger)",
  warn: "var(--color-a-warn)",
  info: "var(--color-a-dim)",
};

export function Notice({
  tone = "info",
  children,
  onDismiss,
}: {
  tone?: NoticeTone;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  const Icon = NOTICE_ICON[tone];
  const color = NOTICE_COLOR[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="mb-5 flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed"
      style={{
        borderColor: `color-mix(in srgb, ${color} 38%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
        color,
      }}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup pesan"
          className="-mr-1 -mt-0.5 shrink-0 rounded p-1 opacity-70 transition-opacity hover:opacity-100"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-[var(--color-a-line-2)] px-6 py-10 text-center">
      <span className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-a-line)] bg-[var(--color-a-surface)] text-[var(--color-a-faint)]">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="text-sm font-medium text-[var(--color-a-text)]">{title}</p>
      {hint && (
        <p className="max-w-md text-xs leading-relaxed text-[var(--color-a-dim)]">
          {hint}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-[var(--color-a-line)] py-4"
        >
          <div className="a-skel h-9 w-9 shrink-0 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="a-skel h-3" style={{ width: `${52 - i * 5}%` }} />
            <div className="a-skel h-2.5" style={{ width: `${34 - i * 3}%` }} />
          </div>
          <div className="a-skel h-9 w-9 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      aria-hidden="true"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-[var(--color-a-line)]"
        >
          <div className="a-skel aspect-[4/3] w-full rounded-none" />
          <div className="flex flex-col gap-2 p-3">
            <div className="a-skel h-3 w-2/3" />
            <div className="a-skel h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-7 flex flex-wrap items-center gap-2.5 border-t border-[var(--color-a-line)] pt-5">
      {children}
    </div>
  );
}

export function SegmentedFilter<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <>
      <div
        className="a-seg hidden sm:inline-flex"
        role="group"
        aria-label={label}
      >
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            aria-pressed={value === o.key}
            className="a-tab"
          >
            {o.label}
            {o.count !== undefined && (
              <span className="a-data ml-1.5">{o.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="relative w-full sm:hidden">
        <label className="sr-only" htmlFor={`seg-${label}`}>
          {label}
        </label>
        <select
          id={`seg-${label}`}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full appearance-none rounded-lg border border-[var(--color-a-line-2)] bg-[var(--color-a-surface)] px-3 py-2.5 pr-9 text-xs font-semibold uppercase tracking-[0.07em] text-[var(--color-a-text)] outline-none transition-colors focus:border-[var(--color-a-accent)]"
        >
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
              {o.count !== undefined ? ` (${o.count})` : ""}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-a-faint)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </>
  );
}
