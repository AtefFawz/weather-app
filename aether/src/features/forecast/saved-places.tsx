import { MapPin, X } from "lucide-react";
import { samePlace } from "@/state/app-state";
import type { Place } from "@/data/models";
import { useI18n } from "@/i18n";
import { placeLabel } from "./place-label";

interface Props {
  places: readonly Place[];
  selected: Place;
  onSelect(place: Place): void;
  onRemove(place: Place): void;
}

export function SavedPlaces({ places, selected, onSelect, onRemove }: Props) {
  const { t, language } = useI18n();
  if (places.length === 0) return null;
  return (
    <nav className="saved" aria-label={t("savedPlaces")}>
      <ul>
        {places.map((place) => {
          const active = samePlace(place, selected);
          const label = placeLabel(place, language, t).name;
          return (
            <li key={place.id} className={active ? "saved__chip saved__chip--active" : "saved__chip"}>
              <button type="button" className="saved__select" aria-current={active ? "true" : undefined} onClick={() => onSelect(place)}>
                <MapPin aria-hidden="true" /> {label}
              </button>
              <button type="button" className="saved__remove" aria-label={`${t("removePlace")}: ${label}`} onClick={() => onRemove(place)}>
                <X aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
