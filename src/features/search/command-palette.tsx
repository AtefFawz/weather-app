import { Command as CommandIcon, LoaderCircle, MapPin, Search, Star } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { fuzzyFilter } from "@/core/fuzzy";
import type { Place } from "@/data/models";
import { useI18n } from "@/i18n";
import { placeLabel } from "@/features/forecast/place-label";
import { samePlace } from "@/state/app-state";
import { usePlaceSearch } from "./use-place-search";

export interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  icon?: ReactNode;
  /** Extra words that should match, e.g. "celsius" for a unit toggle. */
  keywords?: string;
  run(): void;
}

interface Props {
  open: boolean;
  onClose(): void;
  actions: readonly PaletteAction[];
  saved: readonly Place[];
  selected: Place;
  onSelectPlace(place: Place): void;
}

type Item = { kind: "place"; key: string; place: Place; saved: boolean } | { kind: "action"; key: string; action: PaletteAction };

export function CommandPalette({ open, onClose, actions, saved, selected, onSelectPlace }: Props) {
  const { t, language } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  // `close` also fires when we close the dialog ourselves; only a native close (Esc) should notify the parent.
  const closedByApp = useRef(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const search = usePlaceSearch(open ? query : "", language);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      setQuery("");
      setCursor(0);
      input.current?.focus();
    } else if (!open && el.open) {
      closedByApp.current = true;
      // Release focus first so global hotkeys do not mistake the now-hidden input for a text field the user is typing in.
      input.current?.blur();
      el.close();
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const q = query.trim();
    const savedMatches = fuzzyFilter(saved, q, (p) => `${p.name} ${p.admin1} ${p.country}`).map<Item>((place) => ({
      kind: "place",
      key: `s-${place.id}`,
      place,
      saved: true,
    }));
    const remote = search.results
      .filter((p) => !saved.some((s) => samePlace(s, p)))
      .map<Item>((place) => ({ kind: "place", key: `r-${place.id}`, place, saved: false }));
    const matchedActions = fuzzyFilter(actions, q, (a) => `${a.label} ${a.keywords ?? ""}`).map<Item>((action) => ({
      kind: "action",
      key: `a-${action.id}`,
      action,
    }));
    return [...savedMatches, ...remote, ...matchedActions];
  }, [query, saved, search.results, actions]);

  const active = Math.min(cursor, Math.max(0, items.length - 1));

  const choose = (item: Item | undefined) => {
    if (!item) return;
    if (item.kind === "place") onSelectPlace(item.place);
    else item.action.run();
    onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((active + 1) % Math.max(1, items.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((active - 1 + items.length) % Math.max(1, items.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(items[active]);
    }
  };

  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  const showEmpty = query.trim().length >= 2 && !search.loading && items.length === 0;

  return (
    <dialog
      ref={dialog}
      className="palette"
      aria-label={t("paletteLabel")}
      onClose={() => {
        setQuery("");
        setCursor(0);
        if (closedByApp.current) closedByApp.current = false;
        else onClose();
      }}
      onClick={(event) => event.target === dialog.current && onClose()}
    >
      <div className="palette__panel">
        <div className="palette__search">
          <Search aria-hidden="true" />
          <input
            ref={input}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={items.length ? `${listId}-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
          />
          {search.loading && <LoaderCircle className="spin" aria-label={t("searching")} />}
          <kbd>Esc</kbd>
        </div>

        <ul id={listId} role="listbox" aria-label={t("paletteResults")} className="palette__list">
          {items.map((item, index) => {
            const selectedRow = index === active;
            const common = {
              id: `${listId}-${index}`,
              role: "option" as const,
              "aria-selected": selectedRow,
              className: selectedRow ? "palette__item palette__item--active" : "palette__item",
              onMouseMove: () => setCursor(index),
              onClick: () => choose(item),
            };
            if (item.kind === "place") {
              const label = placeLabel(item.place, language, t);
              const current = samePlace(item.place, selected);
              return (
                <li key={item.key} {...common}>
                  {item.saved ? <Star aria-hidden="true" /> : <MapPin aria-hidden="true" />}
                  <span className="palette__label">
                    {label.name}
                    <small>{label.subtitle}</small>
                  </span>
                  {current && <span className="palette__tag">{t("selected")}</span>}
                </li>
              );
            }
            return (
              <li key={item.key} {...common}>
                {item.action.icon ?? <CommandIcon aria-hidden="true" />}
                <span className="palette__label">{item.action.label}</span>
                {item.action.hint && <span className="palette__tag">{item.action.hint}</span>}
              </li>
            );
          })}
        </ul>

        <p className="palette__status muted" role="status">
          {search.error ? t("searchError") : showEmpty ? t("noResults") : query.trim().length < 2 ? t("searchHint") : ""}
        </p>
      </div>
    </dialog>
  );
}
