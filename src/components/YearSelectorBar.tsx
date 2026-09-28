import React from 'react';
import { YearStats, ThemeColors } from '../types';
import { formatNum } from '../utils/contributions';
import { 
  CheckSquare, 
  Square, 
  ArrowUpDown, 
  Filter, 
  SlidersHorizontal,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface YearSelectorBarProps {
  years: YearStats[];
  selectedYears: number[];
  onToggleYear: (year: number) => void;
  onSelectAll: () => void;
  onSelectActiveOnly: () => void;
  onSelectRecent: (count: number) => void;
  isDescending: boolean;
  onToggleSort: () => void;
  cellSize: number;
  onCellSizeChange: (size: number) => void;
  theme: ThemeColors;
}

export const YearSelectorBar: React.FC<YearSelectorBarProps> = ({
  years,
  selectedYears,
  onToggleYear,
  onSelectAll,
  onSelectActiveOnly,
  onSelectRecent,
  isDescending,
  onToggleSort,
  cellSize,
  onCellSizeChange,
  theme,
}) => {
  const allSelected = selectedYears.length === years.length;
  const totalInSelected = years
    .filter((y) => selectedYears.includes(y.year))
    .reduce((sum, y) => sum + y.total, 0);

  return (
    <div 
      className="rounded-2xl border p-4 mb-6 transition-all"
      style={{
        backgroundColor: theme.bgCard,
        borderColor: theme.border,
      }}
    >
      {/* Top controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: theme.border }}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            <span className="text-xs font-semibold" style={{ color: theme.textPrimary }}>
              Years Included:
            </span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md" style={{ backgroundColor: theme.isDark ? '#21262d' : '#e2e8f0', color: theme.textPrimary }}>
              {selectedYears.length} of {years.length} ({formatNum(totalInSelected)} contribs)
            </span>
          </div>

          {/* Quick preset filters */}
          <div className="flex items-center gap-1">
            <button
              onClick={onSelectAll}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer"
              style={{
                backgroundColor: allSelected 
                  ? (theme.isDark ? '#21262d' : '#e2e8f0') 
                  : 'transparent',
                borderColor: theme.border,
                color: theme.textPrimary,
              }}
            >
              All Years
            </button>
            <button
              onClick={onSelectActiveOnly}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer"
              style={{
                backgroundColor: 'transparent',
                borderColor: theme.border,
                color: theme.textPrimary,
              }}
            >
              Active Only
            </button>
            <button
              onClick={() => onSelectRecent(3)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer"
              style={{
                backgroundColor: 'transparent',
                borderColor: theme.border,
                color: theme.textPrimary,
              }}
            >
              Last 3 Years
            </button>
            <button
              onClick={() => onSelectRecent(5)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer"
              style={{
                backgroundColor: 'transparent',
                borderColor: theme.border,
                color: theme.textPrimary,
              }}
            >
              Last 5 Years
            </button>
          </div>
        </div>

        {/* View Options: Sort & Density */}
        <div className="flex items-center gap-2">
          {/* Sort Order */}
          <button
            onClick={onToggleSort}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer"
            style={{
              backgroundColor: theme.isDark ? '#161b22' : '#ffffff',
              borderColor: theme.border,
              color: theme.textPrimary,
            }}
            title={isDescending ? 'Sorted Newest First' : 'Sorted Oldest First'}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{isDescending ? '2026 → 2009' : '2009 → 2026'}</span>
          </button>

          {/* Density Selector */}
          <div className="flex items-center p-0.5 rounded-lg border" style={{ borderColor: theme.border, backgroundColor: theme.isDark ? '#0d1117' : '#ffffff' }}>
            <button
              onClick={() => onCellSizeChange(11)}
              className={`px-2 py-0.5 text-xs font-medium rounded transition-colors cursor-pointer ${cellSize === 11 ? 'font-bold' : ''}`}
              style={{
                backgroundColor: cellSize === 11 ? (theme.isDark ? '#21262d' : '#e2e8f0') : 'transparent',
                color: theme.textPrimary,
              }}
              title="Standard Grid (11px)"
            >
              Standard
            </button>
            <button
              onClick={() => onCellSizeChange(8)}
              className={`px-2 py-0.5 text-xs font-medium rounded transition-colors cursor-pointer ${cellSize === 8 ? 'font-bold' : ''}`}
              style={{
                backgroundColor: cellSize === 8 ? (theme.isDark ? '#21262d' : '#e2e8f0') : 'transparent',
                color: theme.textPrimary,
              }}
              title="Compact Grid (8px)"
            >
              Compact
            </button>
            <button
              onClick={() => onCellSizeChange(5)}
              className={`px-2 py-0.5 text-xs font-medium rounded transition-colors cursor-pointer ${cellSize === 5 ? 'font-bold' : ''}`}
              style={{
                backgroundColor: cellSize === 5 ? (theme.isDark ? '#21262d' : '#e2e8f0') : 'transparent',
                color: theme.textPrimary,
              }}
              title="Micro View (5px)"
            >
              Micro
            </button>
          </div>
        </div>
      </div>

      {/* Year Selection Badges */}
      <div className="pt-3 flex flex-wrap items-center gap-1.5">
        {years.map((yearObj) => {
          const isSelected = selectedYears.includes(yearObj.year);
          const hasContribs = yearObj.total > 0;

          return (
            <button
              key={yearObj.year}
              onClick={() => onToggleYear(yearObj.year)}
              className="group flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer select-none"
              style={{
                backgroundColor: isSelected
                  ? (theme.isDark ? '#21262d' : '#f0f3f6')
                  : 'transparent',
                borderColor: isSelected ? theme.accent : theme.border,
                opacity: hasContribs ? 1 : 0.6,
              }}
            >
              {isSelected ? (
                <CheckSquare className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accent }} />
              ) : (
                <Square className="w-3.5 h-3.5 shrink-0" style={{ color: theme.textMuted }} />
              )}
              <span 
                className="font-mono font-medium"
                style={{ color: isSelected ? theme.textPrimary : theme.textMuted }}
              >
                {yearObj.year}
              </span>
              <span 
                className="font-mono text-[11px] tabular-nums"
                style={{ 
                  color: hasContribs 
                    ? (isSelected ? theme.accent : theme.textMuted) 
                    : theme.textMuted 
                }}
              >
                ({formatNum(yearObj.total)})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
