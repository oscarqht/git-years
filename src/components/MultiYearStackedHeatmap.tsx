import React, { useState, useRef } from 'react';
import { YearStats, ContributionDay, ThemeColors } from '../types';
import { getMonthColumns, formatFullDate, formatNum } from '../utils/contributions';
import { Info, Calendar, Sparkles } from 'lucide-react';

interface MultiYearStackedHeatmapProps {
  years: YearStats[];
  selectedYears: number[];
  cellSize: number;
  theme: ThemeColors;
  isDescending: boolean;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  day: ContributionDay;
  year: number;
}

export const MultiYearStackedHeatmap: React.FC<MultiYearStackedHeatmapProps> = ({
  years,
  selectedYears,
  cellSize,
  theme,
  isDescending,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Filter years to only selected
  const displayedYears = years
    .filter((y) => selectedYears.includes(y.year))
    .sort((a, b) => (isDescending ? b.year - a.year : a.year - b.year));

  const monthColumns = getMonthColumns();
  const gap = cellSize <= 6 ? 2 : 3;
  const colWidth = cellSize + gap;
  const totalGridWidth = 53 * colWidth;

  const handleCellMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    day: ContributionDay,
    year: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      setTooltip({
        visible: true,
        x: rect.left - containerRect.left + cellSize / 2,
        y: rect.top - containerRect.top - 8,
        day,
        year,
      });
    }
  };

  const handleCellMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div 
      ref={containerRef}
      className="relative rounded-2xl border p-4 sm:p-6 mb-6 transition-all"
      style={{
        backgroundColor: theme.bgCard,
        borderColor: theme.border,
      }}
    >
      {/* Chart Header info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b mb-5" style={{ borderColor: theme.border }}>
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: theme.textPrimary }}>
            Multi-Year Contribution Matrix
          </h2>
          <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
            Unified multi-year activity grid · Synchronized week-by-week across all {displayedYears.length} displayed years
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
          <span className="text-[11px]">Less</span>
          <div className="flex items-center gap-1">
            {theme.levels.map((color, idx) => (
              <span
                key={idx}
                className="rounded-xs border"
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  backgroundColor: color,
                  borderColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                }}
                title={theme.levelLabels[idx]}
              />
            ))}
          </div>
          <span className="text-[11px]">More</span>
        </div>
      </div>

      {displayedYears.length === 0 ? (
        <div className="py-16 text-center" style={{ color: theme.textMuted }}>
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">No years selected.</p>
          <p className="text-xs mt-1">Check at least one year above to display the contribution matrix.</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <div style={{ minWidth: `${totalGridWidth + 180}px` }}>
            {/* Common Month Headers Row */}
            <div className="flex items-center pb-2 mb-2 border-b" style={{ borderColor: theme.isDark ? '#21262d' : '#e2e8f0' }}>
              {/* Year column spacer */}
              <div className="w-40 sm:w-44 shrink-0 text-[11px] font-semibold uppercase tracking-wider pl-1" style={{ color: theme.textMuted }}>
                Year & Total
              </div>

              {/* Day label spacer */}
              <div className="w-7 shrink-0" />

              {/* Month label columns */}
              <div className="relative flex-1" style={{ width: `${totalGridWidth}px`, height: '18px' }}>
                {monthColumns.map((m) => (
                  <span
                    key={m.name}
                    className="absolute text-[11px] font-semibold tracking-wide"
                    style={{
                      left: `${m.colIndex * colWidth}px`,
                      color: theme.textMuted,
                    }}
                  >
                    {m.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Stacked Year Rows */}
            <div className="space-y-4">
              {displayedYears.map((yearObj) => {
                const isHovered = hoveredYear === yearObj.year;

                return (
                  <div
                    key={yearObj.year}
                    onMouseEnter={() => setHoveredYear(yearObj.year)}
                    onMouseLeave={() => setHoveredYear(null)}
                    className="flex items-center rounded-xl p-2 transition-colors duration-150"
                    style={{
                      backgroundColor: isHovered 
                        ? (theme.isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.02)')
                        : 'transparent',
                    }}
                  >
                    {/* Left Info: Year + Total Contributions + Peak info */}
                    <div className="w-40 sm:w-44 shrink-0 pr-3 flex flex-col justify-center">
                      <div className="flex items-baseline justify-between">
                        <span 
                          className="text-base font-bold font-mono tracking-tight"
                          style={{ color: theme.textPrimary }}
                        >
                          {yearObj.year}
                        </span>
                        <span 
                          className="text-xs font-mono font-bold tabular-nums"
                          style={{ color: yearObj.total > 0 ? theme.accent : theme.textMuted }}
                        >
                          {formatNum(yearObj.total)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono mt-0.5" style={{ color: theme.textMuted }}>
                        <span>{yearObj.activeDays} active days</span>
                        {yearObj.maxDayCount > 0 && (
                          <span title={`Peak day: ${yearObj.maxDayCount} contributions`}>
                            max {yearObj.maxDayCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Day of Week Row Labels (Mon, Wed, Fri) */}
                    <div 
                      className="w-7 shrink-0 flex flex-col justify-between text-[9px] font-mono select-none pr-1.5"
                      style={{ 
                        height: `${7 * (cellSize + gap) - gap}px`,
                        color: theme.textMuted,
                      }}
                    >
                      <span className="leading-none" style={{ marginTop: `${cellSize * 0.1}px` }}>&nbsp;</span>
                      <span className="leading-none">Mon</span>
                      <span className="leading-none">&nbsp;</span>
                      <span className="leading-none">Wed</span>
                      <span className="leading-none">&nbsp;</span>
                      <span className="leading-none">Fri</span>
                      <span className="leading-none">&nbsp;</span>
                    </div>

                    {/* The 53-Week Heatmap Grid for this year */}
                    <div 
                      className="flex"
                      style={{ 
                        gap: `${gap}px`,
                        width: `${totalGridWidth}px`,
                      }}
                    >
                      {yearObj.weeks.map((week, weekIdx) => (
                        <div 
                          key={weekIdx} 
                          className="flex flex-col"
                          style={{ gap: `${gap}px` }}
                        >
                          {week.map((day, dayIdx) => {
                            if (!day) {
                              return (
                                <div
                                  key={dayIdx}
                                  style={{
                                    width: `${cellSize}px`,
                                    height: `${cellSize}px`,
                                  }}
                                  className="opacity-0"
                                />
                              );
                            }

                            const cellColor = theme.levels[day.level];
                            const isToday = day.date === new Date().toISOString().slice(0, 10);

                            return (
                              <div
                                key={day.date}
                                onMouseEnter={(e) => handleCellMouseEnter(e, day, yearObj.year)}
                                onMouseLeave={handleCellMouseLeave}
                                className={`rounded-xs transition-transform hover:scale-125 hover:z-20 cursor-pointer ${
                                  isToday ? 'ring-1 ring-blue-400' : ''
                                }`}
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
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Tooltip */}
      {tooltip && tooltip.visible && (
        <div
          className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full px-3 py-2 rounded-xl border text-xs shadow-2xl backdrop-blur-md transition-all duration-75 animate-in fade-in zoom-in-95"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            backgroundColor: theme.isDark ? 'rgba(22, 27, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: theme.border,
            color: theme.textPrimary,
          }}
        >
          <div className="font-semibold flex items-center gap-1.5 pb-0.5">
            <span
              className="w-2.5 h-2.5 rounded-xs shrink-0"
              style={{ backgroundColor: theme.levels[tooltip.day.level] }}
            />
            <span className="font-mono font-bold">
              {tooltip.day.count === 0 ? 'No contributions' : `${formatNum(tooltip.day.count)} contribution${tooltip.day.count > 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="text-[11px] font-medium" style={{ color: theme.textMuted }}>
            {formatFullDate(tooltip.day.date)}
          </div>
          {tooltip.day.count > 0 && (
            <div className="text-[10px] font-mono mt-1 pt-1 border-t flex items-center justify-between gap-3" style={{ borderColor: theme.border, color: theme.textMuted }}>
              <span>Intensity: Level {tooltip.day.level}/4</span>
              <span>Year {tooltip.year}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
