import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Dropdown } from '@/shared/ui/Dropdown';
import { useTranslation } from 'react-i18next';
import { IconChevronDown, IconCheckmark, IconSearch, IconX } from '@/shared/ui/icons';
import type { ReactNode } from 'react';

export interface SearchableSelectOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
  searchableText?: string; // override text for search (defaults to label + description)
}

export interface SearchableSelectDropdownProps<T extends string> {
  value: T | '';
  onChange: (value: T) => void;
  options: SearchableSelectOption<T>[];
  label: string;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  containerClassName?: string;
  triggerClassName?: string;
  panelClassName?: string;
  optionClassName?: string;
  activeOptionClassName?: string;
  emptyStateClassName?: string;
  noOptionsMessage?: string;
}

export function SearchableSelectDropdown<T extends string>({
  value,
  onChange,
  options,
  label,
  placeholder,
  ariaLabel,
  disabled = false,
  required = false,
  error,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  containerClassName,
  triggerClassName,
  panelClassName,
  optionClassName,
  activeOptionClassName,
  emptyStateClassName,
  noOptionsMessage,
}: SearchableSelectDropdownProps<T>) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const scrollContainerRef = useRef<HTMLUListElement>(null);

  const current = options.find((option) => option.value === value);
  const displayLabel = current
    ? current.description
      ? `${current.label} — ${current.description}`
      : current.label
    : placeholder || label;

  // Filtrar opciones por búsqueda
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase();
    return options.filter((option) => {
      const searchText =
        option.searchableText || `${option.label} ${option.description || ''}`.toLowerCase();
      return searchText.includes(query);
    });
  }, [options, searchQuery]);

  // Manejar scroll infinito
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLUListElement>) => {
      const ul = e.currentTarget;
      const isNearBottom = ul.scrollHeight - ul.scrollTop - ul.clientHeight < 100;

      if (isNearBottom && hasMore && !isLoading && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore],
  );

  return (
    <div className={containerClassName || 'flex flex-col gap-1.5'}>
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span aria-hidden="true" className="text-red-500 ml-1">
            *
          </span>
        )}
      </label>

      <Dropdown
        ariaLabel={ariaLabel || label}
        panelRole="listbox"
        panelClassName={
          panelClassName ||
          'absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-1 z-50'
        }
        containerClassName="w-full"
        trigger={({ open, toggle }) => (
          <button
            type="button"
            onClick={toggle}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={ariaLabel || label}
            aria-invalid={!!error}
            className={[
              'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left text-sm',
              error
                ? 'border-red-300 bg-red-50 text-red-900'
                : 'border-slate-300 bg-white text-slate-900 hover:border-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500',
              'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
              triggerClassName ?? '',
            ].join(' ')}
          >
            <span className="truncate">{displayLabel}</span>
            {isLoading ? (
              <div
                className="h-4 w-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin shrink-0"
                aria-hidden="true"
              />
            ) : (
              <span className="opacity-60 shrink-0" aria-hidden="true">
                <IconChevronDown />
              </span>
            )}
          </button>
        )}
      >
        {({ close }) => {
          function select(nextValue: T) {
            onChange(nextValue);
            setSearchQuery('');
            close();
          }

          return (
            <div className="flex flex-col max-h-96 min-h-fit">
              {/* Search input */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 dark:border-white/10 flex-shrink-0">
                <IconSearch className="w-4 h-4 text-slate-400" aria-hidden="true" />
                <input
                  type="text"
                  placeholder={t('common.search') || 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  aria-label={`${t('common.search') || 'Search'} ${label}`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={t('common.clear') || 'Clear'}
                  >
                    <IconX className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Options list */}
              <ul ref={scrollContainerRef} onScroll={handleScroll} className="overflow-y-auto">
                {filteredOptions.length === 0 && (
                  <li
                    className={[
                      'px-3 py-2 text-sm text-slate-500 dark:text-slate-400 text-center',
                      emptyStateClassName ?? '',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {searchQuery
                      ? t('common.noResults') || 'No results'
                      : noOptionsMessage || t('common.noMoreOptions')}
                  </li>
                )}

                {filteredOptions.map((option) => {
                  const active = value === option.value;

                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={active}
                      className="flex flex-col"
                    >
                      <button
                        type="button"
                        onClick={() => select(option.value)}
                        className={[
                          'w-full flex items-start gap-2.5 px-3 py-2 text-sm transition-colors',
                          active
                            ? (activeOptionClassName ??
                              'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 font-semibold')
                            : (optionClassName ??
                              'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'),
                        ].join(' ')}
                      >
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          {option.icon && <span className="shrink-0 mt-0.5">{option.icon}</span>}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{option.label}</div>
                            {option.description && (
                              <div className="text-xs opacity-75 line-clamp-2">
                                {option.description}
                              </div>
                            )}
                          </div>
                        </div>
                        {active && (
                          <span className="ml-auto shrink-0 mt-0.5" aria-hidden="true">
                            <IconCheckmark />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <li className="px-3 py-2 text-center" aria-hidden="true">
                    <div className="h-4 w-4 mx-auto border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  </li>
                )}
              </ul>

              {/* Load more hint */}
              {hasMore && !isLoading && (
                <div className="text-xs text-slate-500 dark:text-slate-400 px-3 py-2 border-t border-slate-200 dark:border-white/10 text-center flex-shrink-0">
                  {t('common.scrollForMore') || 'Scroll for more'}
                </div>
              )}
            </div>
          );
        }}
      </Dropdown>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
