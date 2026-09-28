import React, { useState, useRef, useEffect } from 'react';
import { YearStats, ThemeColors } from '../types';
import { formatNum } from '../utils/contributions';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Award, BarChart3, Table as TableIcon } from 'lucide-react';

interface AnnualGrowthBarChartProps {
  years: YearStats[];
  selectedYears?: number[];
  theme: ThemeColors;
}

interface GrowthHighlight {
  year: number;
  change: number;
  from: number;
  to: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowOffset: number;
}

export const AnnualGrowthBarChart: React.FC<AnnualGrowthBarChartProps> = ({ years, selectedYears, theme }) => {
  const [viewFormat, setViewFormat] = useState<'chart' | 'table'>('chart');
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [hoveredItem, setHoveredItem] = useState<(YearStats & { cumulativeTotal: number; yoyChange: number | null }) | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);

  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hoveredElRef = useRef<HTMLElement | null>(null);

  // Filter by selectedYears if provided
  const filteredYears = selectedYears && selectedYears.length > 0
    ? years.filter((y) => selectedYears.includes(y.year))
    : years;

  // Chronological order for annual growth (oldest to newest)
  const chronologicalYears = [...filteredYears].sort((a, b) => a.year - b.year);

  // Find max annual contribution in selected years
  const maxAnnual = Math.max(...chronologicalYears.map((y) => y.total), 1);

  // Calculate cumulative contributions over time for the selected subset
  let cumulative = 0;
  const yearsWithCumulative = chronologicalYears.map((y, idx) => {
    cumulative += y.total;
    const prevYear = idx > 0 ? chronologicalYears[idx - 1] : null;
    let yoyChange: number | null = null;
    if (prevYear && prevYear.total > 0) {
      yoyChange = Math.round(((y.total - prevYear.total) / prevYear.total) * 100);
    } else if (prevYear && prevYear.total === 0 && y.total > 0) {
      yoyChange = 100;
    }

    return {
      ...y,
      cumulativeTotal: cumulative,
      yoyChange,
    };
  });

  // Calculate dynamic fastest growth year among the displayed years
  const fastestGrowthItem = (() => {
    let best: GrowthHighlight | null = null;
    for (let idx = 1; idx < yearsWithCumulative.length; idx++) {
      const item = yearsWithCumulative[idx];
      const prev = yearsWithCumulative[idx - 1];
      if (item.yoyChange !== null) {
        if (!best || item.yoyChange > best.change) {
          best = {
            year: item.year,
            change: item.yoyChange,
            from: prev.total,
            to: item.total,
          };
        }
      }
    }
    return best;
  })();

  const bestYearInSelection = yearsWithCumulative.length > 0
    ? yearsWithCumulative.reduce((max, y) => (y.total > max.total ? y : max), yearsWithCumulative[0])
    : null;

  const calculateTooltipPosition = (targetEl: HTMLElement) => {
    if (!chartWrapperRef.current) return null;
    const wrapperRect = chartWrapperRef.current.getBoundingClientRect();
    const barRect = targetEl.getBoundingClientRect();

    // Check if the hovered element is scrolled outside view
    if (barRect.right < wrapperRect.left || barRect.left > wrapperRect.right) {
      return null;
    }

    const barCenterX = barRect.left + barRect.width / 2 - wrapperRect.left;
    const wrapperWidth = wrapperRect.width;

    // Clamp tooltip center X so the badge (approx 210px wide) never extends past the container edges
    const clampedX = Math.max(115, Math.min(wrapperWidth - 115, barCenterX));
    const arrowOffset = Math.max(-80, Math.min(80, barCenterX - clampedX));

    return {
      top: 6,
      left: clampedX,
      arrowOffset,
    };
  };

  const handleBarMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    item: typeof yearsWithCumulative[0]
  ) => {
    setHoveredYear(item.year);
    setHoveredItem(item);
    hoveredElRef.current = e.currentTarget;

    const pos = calculateTooltipPosition(e.currentTarget);
    if (pos) {
      setTooltipPos(pos);
    }
  };

  const handleBarMouseLeave = () => {
    setHoveredYear(null);
    setHoveredItem(null);
    hoveredElRef.current = null;
    setTooltipPos(null);
  };

  const handleScroll = () => {
    if (hoveredElRef.current && hoveredYear !== null) {
      const pos = calculateTooltipPosition(hoveredElRef.current);
      if (pos) {
        setTooltipPos(pos);
      } else {
        // Element scrolled out of container view
        setHoveredYear(null);
        setHoveredItem(null);
        hoveredElRef.current = null;
        setTooltipPos(null);
      }
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (hoveredElRef.current) {
        const pos = calculateTooltipPosition(hoveredElRef.current);
        if (pos) setTooltipPos(pos);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      className="rounded-2xl border p-4 sm:p-6 mb-6 transition-all"
      style={{
        backgroundColor: theme.bgCard,
        borderColor: theme.border,
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b mb-6" style={{ borderColor: theme.border }}>
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: theme.textPrimary }}>
            Year-over-Year Growth & Lifetime Trajectory
          </h2>
          <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
            Annual volume distribution, YoY growth rates, and cumulative lifetime milestones
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center p-1 rounded-xl border" style={{ borderColor: theme.border, backgroundColor: theme.isDark ? '#0d1117' : '#ffffff' }}>
          <button
            onClick={() => {
              setViewFormat('chart');
              handleBarMouseLeave();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            style={{
              backgroundColor: viewFormat === 'chart' ? (theme.isDark ? '#21262d' : '#f0f3f6') : 'transparent',
              color: viewFormat === 'chart' ? theme.accent : theme.textMuted,
            }}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Visual Chart</span>
          </button>
          <button
            onClick={() => {
              setViewFormat('table');
              handleBarMouseLeave();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            style={{
              backgroundColor: viewFormat === 'table' ? (theme.isDark ? '#21262d' : '#f0f3f6') : 'transparent',
              color: viewFormat === 'table' ? theme.accent : theme.textMuted,
            }}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Data Ledger</span>
          </button>
        </div>
      </div>

      {viewFormat === 'chart' ? (
        <div>
          {/* Main Bar Chart Wrapper with Floating Tooltip outside the scroll container */}
          <div ref={chartWrapperRef} className="relative">
            {/* Floating Tooltip Badge - positioned outside overflow container so it is NEVER clipped and NEVER causes horizontal scrollbar */}
            {hoveredItem && tooltipPos && (
              <div 
                className="absolute z-40 pointer-events-none transition-all duration-75 animate-in fade-in zoom-in-95"
                style={{
                  top: `${tooltipPos.top}px`,
                  left: `${tooltipPos.left}px`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div 
                  className="relative px-3.5 py-2.5 rounded-xl border text-xs shadow-2xl whitespace-nowrap"
                  style={{
                    backgroundColor: theme.isDark ? 'rgba(22, 27, 34, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                    borderColor: theme.border,
                    color: theme.textPrimary,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div className="font-bold flex items-center justify-between gap-4">
                    <span className="text-sm font-bold">{hoveredItem.year}</span>
                    <span className="font-mono font-bold text-emerald-400">{formatNum(hoveredItem.total)} contribs</span>
                  </div>
                  <div className="text-[11px] font-mono mt-1 text-gray-400 space-y-0.5">
                    <div>Cumulative: {formatNum(hoveredItem.cumulativeTotal)}</div>
                    <div>Active days: {hoveredItem.activeDays} days</div>
                    {hoveredItem.yoyChange !== null && (
                      <div className={hoveredItem.yoyChange >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                        YoY Change: {hoveredItem.yoyChange >= 0 ? `+${hoveredItem.yoyChange}%` : `${hoveredItem.yoyChange}%`}
                      </div>
                    )}
                  </div>

                  {/* Downward pointing caret directed towards the hovered bar */}
                  <div 
                    className="absolute -bottom-1 w-2.5 h-2.5 border-r border-b"
                    style={{
                      left: `calc(50% + ${tooltipPos.arrowOffset}px)`,
                      transform: 'translateX(-50%) rotate(45deg)',
                      backgroundColor: theme.isDark ? '#161b22' : '#ffffff',
                      borderColor: theme.border,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Scrollable Bars Area with generous top headroom for the badge and labels */}
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="relative pt-24 pb-2 overflow-x-auto scrollbar-thin"
            >
              <div className="min-w-[680px] w-full h-56 flex items-end gap-2 sm:gap-4 px-3 border-b" style={{ borderColor: theme.border }}>
                {yearsWithCumulative.map((item) => {
                  const heightPercent = maxAnnual > 0 ? (item.total / maxAnnual) * 100 : 0;
                  const isHovered = hoveredYear === item.year;
                  const isMax = item.total === maxAnnual;

                  return (
                    <div
                      key={item.year}
                      onMouseEnter={(e) => handleBarMouseEnter(e, item)}
                      onMouseLeave={handleBarMouseLeave}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer rounded-lg transition-colors py-1"
                      style={{
                        backgroundColor: isHovered 
                          ? (theme.isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)')
                          : 'transparent'
                      }}
                    >
                      {/* Bar Label above bar (if notable or hovered) */}
                      {(isHovered || isMax) && (
                        <span 
                          className="text-[10px] font-mono font-bold tabular-nums mb-1 pointer-events-none"
                          style={{ color: isMax ? '#eab308' : theme.textPrimary }}
                        >
                          {formatNum(item.total)}
                        </span>
                      )}

                      {/* Bar */}
                      <div
                        className="w-full rounded-t-md transition-all duration-300 relative overflow-hidden"
                        style={{
                          height: `${Math.max(heightPercent, 2)}%`,
                          backgroundColor: isMax 
                            ? '#10b981' 
                            : isHovered 
                              ? theme.levels[3] 
                              : (item.total > 0 ? theme.levels[2] : (theme.isDark ? '#21262d' : '#e2e8f0')),
                        }}
                      >
                        {isMax && (
                          <div className="absolute top-0.5 left-1/2 -translate-x-1/2">
                            <Award className="w-3 h-3 text-yellow-300" />
                          </div>
                        )}
                      </div>

                      {/* Year Label */}
                      <div 
                        className="text-[11px] font-mono font-medium mt-2 pt-1 transition-colors"
                        style={{ 
                          color: isHovered || isMax ? theme.textPrimary : theme.textMuted,
                          fontWeight: isHovered || isMax ? 700 : 500
                        }}
                      >
                        {String(item.year).slice(2)}'
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick YoY Highlights */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border" style={{ borderColor: theme.border }}>
              <div className="text-[11px] font-semibold uppercase" style={{ color: theme.textMuted }}>Fastest Growth Year</div>
              <div className="text-base font-bold font-mono mt-1" style={{ color: theme.accent }}>
                {fastestGrowthItem ? `${fastestGrowthItem.year} (+${fastestGrowthItem.change}%)` : (yearsWithCumulative[0]?.year ? `${yearsWithCumulative[0].year}` : 'N/A')}
              </div>
              <div className="text-[11px]" style={{ color: theme.textMuted }}>
                {fastestGrowthItem ? `Surged from ${formatNum(fastestGrowthItem.from)} to ${formatNum(fastestGrowthItem.to)}` : 'Baseline in selection'}
              </div>
            </div>

            <div className="p-3 rounded-xl border" style={{ borderColor: theme.border }}>
              <div className="text-[11px] font-semibold uppercase" style={{ color: theme.textMuted }}>Peak in Selection</div>
              <div className="text-base font-bold font-mono mt-1" style={{ color: '#eab308' }}>
                {bestYearInSelection?.year || 'N/A'}
              </div>
              <div className="text-[11px]" style={{ color: theme.textMuted }}>{formatNum(maxAnnual)} total contributions</div>
            </div>

            <div className="p-3 rounded-xl border" style={{ borderColor: theme.border }}>
              <div className="text-[11px] font-semibold uppercase" style={{ color: theme.textMuted }}>Selected Cumulative</div>
              <div className="text-base font-bold font-mono mt-1" style={{ color: theme.textPrimary }}>
                {formatNum(cumulative)}
              </div>
              <div className="text-[11px]" style={{ color: theme.textMuted }}>Across {yearsWithCumulative.length} selected years</div>
            </div>

            <div className="p-3 rounded-xl border" style={{ borderColor: theme.border }}>
              <div className="text-[11px] font-semibold uppercase" style={{ color: theme.textMuted }}>Active Years</div>
              <div className="text-base font-bold font-mono mt-1" style={{ color: theme.textPrimary }}>
                {yearsWithCumulative.filter(y => y.total > 0).length} of {yearsWithCumulative.length}
              </div>
              <div className="text-[11px]" style={{ color: theme.textMuted }}>Years with commits</div>
            </div>
          </div>
        </div>
      ) : (
        /* Data Ledger Table */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b" style={{ borderColor: theme.border, color: theme.textMuted }}>
                <th className="pb-2 font-semibold">Year</th>
                <th className="pb-2 font-semibold text-right">Contributions</th>
                <th className="pb-2 font-semibold text-right">YoY Change</th>
                <th className="pb-2 font-semibold text-right">Active Days</th>
                <th className="pb-2 font-semibold text-right">Peak Day</th>
                <th className="pb-2 font-semibold text-right">Cumulative Total</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: theme.isDark ? '#21262d' : '#f1f5f9' }}>
              {[...yearsWithCumulative].reverse().map((item) => (
                <tr key={item.year} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="py-2.5 font-bold" style={{ color: theme.textPrimary }}>{item.year}</td>
                  <td className="py-2.5 text-right font-bold tabular-nums" style={{ color: item.total > 0 ? theme.accent : theme.textMuted }}>
                    {formatNum(item.total)}
                  </td>
                  <td className="py-2.5 text-right tabular-nums">
                    {item.yoyChange !== null ? (
                      <span className={`inline-flex items-center gap-0.5 ${item.yoyChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {item.yoyChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {item.yoyChange >= 0 ? `+${item.yoyChange}%` : `${item.yoyChange}%`}
                      </span>
                    ) : (
                      <span style={{ color: theme.textMuted }}>-</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right tabular-nums" style={{ color: theme.textPrimary }}>
                    {item.activeDays} ({((item.activeDays / 365) * 100).toFixed(0)}%)
                  </td>
                  <td className="py-2.5 text-right tabular-nums" style={{ color: theme.textMuted }}>
                    {item.maxDayCount > 0 ? `${item.maxDayCount} contribs` : '-'}
                  </td>
                  <td className="py-2.5 text-right font-bold tabular-nums" style={{ color: theme.textPrimary }}>
                    {formatNum(item.cumulativeTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
