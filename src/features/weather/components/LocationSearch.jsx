import { useEffect, useRef, useState } from 'react';
import { searchLocations } from '../api/openMeteo';
import { Icon } from '../../../lib/icons';

export function LocationSearch({ language, t, onSelect }) {
  const [query, setQuery] = useState('');
  const [searchState, setSearchState] = useState({ query: '', results: [], loading: false, error: false });
  const results = searchState.query === query.trim() ? searchState.results : [];
  const loading = query.trim().length >= 2 && (searchState.query !== query.trim() || searchState.loading);
  const error = searchState.query === query.trim() && searchState.error;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const rootRef = useRef(null);
  const panelVisible = open && query.trim().length >= 2;


  useEffect(() => {
    function handleOutsidePointer(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('pointerdown', handleOutsidePointer);
    return () => document.removeEventListener('pointerdown', handleOutsidePointer);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return undefined;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearchState({ query: trimmed, results: [], loading: true, error: false });
      try {
        const locations = await searchLocations(trimmed, { language, signal: controller.signal });
        setSearchState({ query: trimmed, results: locations, loading: false, error: false });
        setActiveIndex(-1);
      } catch (requestError) {
        if (requestError?.name !== 'AbortError') {
          setSearchState({ query: trimmed, results: [], loading: false, error: true });
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchState((previous) => previous.query === trimmed ? { ...previous, loading: false } : previous);
        }
      }
    }, 320);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, language]);

  function choose(location) {
    onSelect(location);
    setQuery('');
    setSearchState({ query: '', results: [], loading: false, error: false });
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % results.length);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => current <= 0 ? results.length - 1 : current - 1);
    }
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      choose(results[activeIndex]);
    }
  }

  return (
    <div className={`location-search ${panelVisible ? 'location-search--open' : ''}`} ref={rootRef}>
      <Icon name="search" size={18} className="location-search__icon" />
      <input
        ref={inputRef}
        value={query}
        type="search"
        placeholder={t('searchPlaceholder')}
        aria-label={t('searchLabel')}
        aria-expanded={panelVisible}
        aria-controls="location-search-results"
        aria-activedescendant={activeIndex >= 0 ? `location-option-${activeIndex}` : undefined}
        aria-autocomplete="list"
        role="combobox"
        onFocus={() => setOpen(true)}
        onBlur={() => { setOpen(false); setActiveIndex(-1); }}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onKeyDown={handleKeyDown}
      />
      {query && (
        <button className="icon-button location-search__clear" type="button" aria-label={t('clearSearch') || 'Clear search'} onClick={() => { setQuery(''); setSearchState({ query: '', results: [], loading: false, error: false }); inputRef.current?.focus(); }}>
          <Icon name="close" size={15} />
        </button>
      )}
      {panelVisible && (
        <div className="search-popover" id="location-search-results" role="listbox" aria-label={t('searchResults')}>
          {loading && <div className="search-message" role="status"><span className="mini-spinner" />{t('searching') || t('searchHint')}</div>}
          {!loading && error && <div className="search-message search-message--error">{t('searchError')}</div>}
          {!loading && !error && results.length === 0 && <div className="search-message">{t('noResults')}</div>}
          {!loading && results.map((location, index) => (
            <button
              type="button"
              role="option"
              id={`location-option-${index}`}
              aria-selected={activeIndex === index}
              className={`search-result ${activeIndex === index ? 'is-active' : ''}`}
              key={location.id}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(location)}
            >
              <span className="search-result__pin"><Icon name="pin" size={17} /></span>
              <span className="search-result__text">
                <strong>{location.name}</strong>
                <small>{[location.admin1, location.country].filter(Boolean).join(', ')}</small>
              </span>
              <Icon name="arrow" size={15} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
