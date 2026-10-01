"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Menahan fokus di dalam container selama `active` true, dan mengembalikan
 * fokus ke elemen sebelumnya saat `active` menjadi false atau saat unmount.
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;

    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const focusables = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.closest("[inert]"));

    const first = focusables()[0];
    if (first) {
      first.focus();
    } else {
      container.tabIndex = -1;
      container.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusables();
      const current = document.activeElement;

      if (items.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const inside =
        current instanceof HTMLElement && container.contains(current);

      if (event.shiftKey) {
        if (!inside || current === firstItem || current === container) {
          event.preventDefault();
          lastItem.focus();
        }
        return;
      }

      if (!inside || current === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previous && previous.isConnected) previous.focus();
    };
  }, [active]);

  return ref;
}
