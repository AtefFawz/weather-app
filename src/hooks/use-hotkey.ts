import { useEffect } from "react";

/** Global keyboard shortcut. `mod` matches Ctrl or ⌘. Ignored while typing in a field unless `allowInInput`. */
export function useHotkey(key: string, handler: (event: KeyboardEvent) => void, options: { mod?: boolean; allowInInput?: boolean } = {}) {
  const { mod = false, allowInInput = false } = options;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return;
      if (mod !== (event.metaKey || event.ctrlKey)) return;
      if (!mod && (event.altKey || event.shiftKey)) return;
      const target = event.target as HTMLElement | null;
      const typing = target?.matches("input, textarea, select, [contenteditable='true']");
      if (typing && !allowInInput) return;
      handler(event);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, handler, mod, allowInInput]);
}
