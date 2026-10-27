import React, { useState, useEffect, useRef } from 'react';
import { assetService } from '../../services/apiClient';
import { AssetItem } from '../../types';

interface AssetAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (asset: AssetItem) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  required?: boolean;
  maxLength?: number;
  disabled?: boolean;
}

export const AssetAutocompleteInput: React.FC<AssetAutocompleteInputProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Ex: HGLG11, MXRF11',
  className = '',
  autoFocus = false,
  required = false,
  maxLength = 10,
  disabled = false
}) => {
  const [availableAssets, setAvailableAssets] = useState<AssetItem[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<AssetItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    assetService
      .listAssets()
      .then((items) => {
        if (isMounted && Array.isArray(items)) {
          setAvailableAssets(items);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const query = value.trim().toUpperCase();
    if (!query || query.length < 1) {
      setFilteredMatches([]);
      setIsOpen(false);
      return;
    }

    const matches = availableAssets
      .filter((asset) => {
        const symbol = (asset.ticker || '').toUpperCase();
        const assetName = (asset.name || '').toUpperCase();
        const segment = ((asset.metadata?.segment as string) || '').toUpperCase();
        return symbol.includes(query) || assetName.includes(query) || segment.includes(query);
      })
      .slice(0, 8);

    setFilteredMatches(matches);
    setIsOpen(matches.length > 0);
    setHighlightedIndex(-1);
  }, [value, availableAssets]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectAsset = (asset: AssetItem) => {
    onChange(asset.ticker);
    if (onSelect) {
      onSelect(asset);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredMatches.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredMatches.length - 1 ? prev + 1 : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredMatches.length - 1));
    } else if (event.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredMatches.length) {
        event.preventDefault();
        handleSelectAsset(filteredMatches[highlightedIndex]);
      }
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onFocus={() => {
          if (value.trim().length > 0 && filteredMatches.length > 0) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required={required}
        maxLength={maxLength}
        disabled={disabled}
        className={className}
        autoComplete="off"
        spellCheck="false"
      />

      {isOpen && filteredMatches.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/95 p-1 shadow-2xl backdrop-blur-xl animate-fadeIn">
          {filteredMatches.map((asset, index) => {
            const isSelected = highlightedIndex === index;
            const segment = (asset.metadata?.segment as string) || asset.type;
            return (
              <div
                key={asset.id || asset.ticker}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectAsset(asset);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs transition ${
                  isSelected
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-white'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="rounded-lg bg-emerald-500/10 px-2 py-1 font-mono text-xs font-bold text-emerald-400 border border-emerald-500/20 shrink-0">
                    {asset.ticker}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold truncate text-white leading-tight">
                      {asset.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {asset.type} &bull; {segment}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  Selecionar
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
