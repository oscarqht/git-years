import React, { useRef, useState } from 'react';
import { ContributionDay, ThemeColors } from '../types';
import { formatFullDate, formatNum } from '../utils/contributions';
import { Sparkles, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface ContinuousTimelineRibbonProps {
  days: ContributionDay[];
  theme: ThemeColors;
}

export const ContinuousTimelineRibbon: React.FC<ContinuousTimelineRibbonProps> = ({ days, theme }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);

  // Group continuous days into 7-day columns for a single panoramic ribbon
  // Each column has 7 days (Sun -> Sat)
  const columns: ContributionDay[][] = [];
  let col: ContributionDay[] = [];

  for (let i = 0; i < days.length; i++) {
    col.push(days[i]);
    if (col.length === 7) {
      columns.push(col);
      col = [];
    }
  }
  if (col.length > 0) {
    columns.push(col);
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const cellSize = 11;
  const gap = 3;

  return (
    <div 
      className="rounded-2xl border p-4 sm:p-6 mb-6 transition-all"
      style={{
        backgroundColor: theme.bgCard,
        borderColor: theme.border,
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b mb-4" style={{ borderColor: theme.border }}>
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: theme.textPrimary }}>
            Continuous Panoramic Timeline
          </h2>
          <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
            Infinite chronological ribbon showing all {days.length} consecutive days from inception to today
          </p>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg border transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ borderColor: theme.border, color: theme.textPrimary }}
            title="Scroll Left (Earlier)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg border transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ borderColor: theme.border, color: theme.textPrimary }}
            title="Scroll Right (Later)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hover Info bar */}
      <div 
        className="h-8 flex items-center justify-between px-3 rounded-lg border mb-3 text-xs font-mono"
        style={{
          backgroundColor: theme.isDark ? '#0d1117' : '#f8fafc',
          borderColor: theme.border,
        }}
      >
        {hoveredDay ? (
          <>
            <span className="font-semibold" style={{ color: theme.textPrimary }}>
              {formatFullDate(hoveredDay.date)}
            </span>
            <span className="font-bold" style={{ color: hoveredDay.count > 0 ? theme.accent : theme.textMuted }}>
              {hoveredDay.count === 0 ? 'No contributions' : `${formatNum(hoveredDay.count)} contributions`}
            </span>
          </>
        ) : (
          <span style={{ color: theme.textMuted }}>
            Hover any square in the timeline ribbon to see date and contribution count
          </span>
        )}
      </div>

      {/* The Scrollable Panoramic Ribbon */}
      <div 
        ref={scrollRef} 
        className="overflow-x-auto pb-4 scrollbar-thin scroll-smooth"
      >
        <div 
          className="flex items-start"
          style={{ gap: `${gap}px`, width: `${columns.length * (cellSize + gap)}px` }}
        >
          {columns.map((column, colIdx) => {
            const firstDateInCol = column[0]?.date || '';
            const isNewYear = firstDateInCol.endsWith('-01-01') || firstDateInCol.endsWith('-01-02') || firstDateInCol.endsWith('-01-03');
            const yearStr = firstDateInCol.slice(0, 4);

            return (
              <div key={colIdx} className="relative flex flex-col" style={{ gap: `${gap}px` }}>
                {/* Year tag indicator */}
                {isNewYear && (
                  <div 
                    className="absolute -top-6 left-0 text-[10px] font-mono font-bold whitespace-nowrap px-1 rounded border z-10"
                    style={{
                      backgroundColor: theme.isDark ? '#21262d' : '#e2e8f0',
                      borderColor: theme.border,
                      color: theme.accent,
                    }}
                  >
                    {yearStr}
                  </div>
                )}

                {/* Day cells in this 7-day column */}
                {column.map((day) => {
                  const cellColor = theme.levels[day.level];
                  return (
                    <div
                      key={day.date}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="rounded-xs transition-transform hover:scale-150 hover:z-20 cursor-pointer"
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        backgroundColor: cellColor,
                        border: day.level === 0
                          ? (theme.isDark ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(0,0,0,0.05)')
                          : 'none',
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
