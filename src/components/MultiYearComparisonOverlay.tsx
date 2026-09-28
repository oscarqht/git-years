import React, { useState } from 'react';
import { YearStats, ThemeColors } from '../types';
import { MONTH_NAMES, formatNum } from '../utils/contributions';
import { LineChart, BarChart2, TrendingUp, Info } from 'lucide-react';

interface MultiYearComparisonOverlayProps {
  years: YearStats[];
  selectedYears: number[];
  theme: ThemeColors;
}

const YEAR_LINE_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', 
  '#06b6d4', '#14b8a6', '#f97316', '#a855f7', '#64748b',
  '#84cc16', '#eab308', '#d946ef', '#6366f1', '#10b981'
];

export const MultiYearComparisonOverlay: React.FC<MultiYearComparisonOverlayProps> = ({
  years,
  selectedYears,
  theme,
}) => {
  const [chartMode, setChartMode] = useState<'monthly' | 'cumulative'>('cumulative');
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  // Filter selected years, take up to 8 most active or selected years for clean visual overlay
  const activeYears = years.filter((y) => selectedYears.includes(y.year));

  // Compute monthly data and cumulative data for each year
  // Each year has 12 points
  const yearSeries = activeYears.map((yearObj, index) => {
    const monthly = yearObj.monthlyTotals;
    let running = 0;
    const cumulative = monthly.map((val) => {
      running += val;
      return running;
    });

    const color = YEAR_LINE_COLORS[index % YEAR_LINE_COLORS.length];

    return {
      year: yearObj.year,
      total: yearObj.total,
      monthly,
      cumulative,
      color,
    };
  });

  // Calculate max Y value
  let maxY = 10;
  for (const s of yearSeries) {
    const values = chartMode === 'cumulative' ? s.cumulative : s.monthly;
    for (const v of values) {
      if (v > maxY) maxY = v;
    }
  }
  // Add 10% headroom
  maxY = Math.ceil(maxY * 1.1) || 10;

  // SVG dimensions
  const width = 800;
  const height = 340;
  const padding = { top: 25, right: 30, bottom: 45, left: 60 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Scales
  const getX = (monthIdx: number) => padding.left + (monthIdx / 11) * innerWidth;
  const getY = (val: number) => padding.top + innerHeight - (val / maxY) * innerHeight;

  // Grid lines
  const yTicks = [0, Math.round(maxY * 0.25), Math.round(maxY * 0.5), Math.round(maxY * 0.75), maxY];

  return (
    <div 
      className="rounded-2xl border p-4 sm:p-6 mb-6 transition-all"
      style={{
        backgroundColor: theme.bgCard,
        borderColor: theme.border,
      }}
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b mb-5" style={{ borderColor: theme.border }}>
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: theme.textPrimary }}>
            Multi-Year Comparative Overlay
          </h2>
          <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
            Direct seasonal overlay comparing contribution pace across all selected years in a single chart
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center p-1 rounded-xl border" style={{ borderColor: theme.border, backgroundColor: theme.isDark ? '#0d1117' : '#ffffff' }}>
          <button
            onClick={() => setChartMode('cumulative')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            style={{
              backgroundColor: chartMode === 'cumulative' ? (theme.isDark ? '#21262d' : '#f0f3f6') : 'transparent',
              color: chartMode === 'cumulative' ? theme.accent : theme.textMuted,
            }}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Cumulative Pace</span>
          </button>
          <button
            onClick={() => setChartMode('monthly')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            style={{
              backgroundColor: chartMode === 'monthly' ? (theme.isDark ? '#21262d' : '#f0f3f6') : 'transparent',
              color: chartMode === 'monthly' ? theme.accent : theme.textMuted,
            }}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Monthly Output</span>
          </button>
        </div>
      </div>

      {/* Year Series Legend & Quick Toggles */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {yearSeries.map((s) => (
          <div
            key={s.year}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono"
            style={{
              backgroundColor: theme.isDark ? '#161b22' : '#ffffff',
              borderColor: theme.border,
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="font-semibold" style={{ color: theme.textPrimary }}>{s.year}</span>
            <span className="tabular-nums" style={{ color: theme.textMuted }}>({formatNum(s.total)})</span>
          </div>
        ))}
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative overflow-x-auto">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto max-h-[380px] overflow-visible select-none"
        >
          {/* Horizontal Grid lines */}
          {yTicks.map((tick, i) => {
            const yPos = getY(tick);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={width - padding.right}
                  y2={yPos}
                  stroke={theme.isDark ? '#30363d' : '#e2e8f0'}
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontFamily="JetBrains Mono"
                  fill={theme.textMuted}
                >
                  {formatNum(tick)}
                </text>
              </g>
            );
          })}

          {/* Month Vertical Guidelines */}
          {MONTH_NAMES.map((m, i) => {
            const xPos = getX(i);
            const isHovered = hoveredMonthIdx === i;

            return (
              <g key={m}>
                <line
                  x1={xPos}
                  y1={padding.top}
                  x2={xPos}
                  y2={height - padding.bottom}
                  stroke={isHovered ? theme.accent : (theme.isDark ? '#21262d' : '#f1f5f9')}
                  strokeWidth={isHovered ? 2 : 1}
                />
                <text
                  x={xPos}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight={isHovered ? "bold" : "normal"}
                  fontFamily="Plus Jakarta Sans"
                  fill={isHovered ? theme.accent : theme.textMuted}
                >
                  {m}
                </text>
              </g>
            );
          })}

          {/* Year Lines */}
          {yearSeries.map((s) => {
            const values = chartMode === 'cumulative' ? s.cumulative : s.monthly;
            
            // Build SVG path
            let d = '';
            values.forEach((v, idx) => {
              const x = getX(idx);
              const y = getY(v);
              if (idx === 0) {
                d += `M ${x} ${y}`;
              } else {
                // Smooth cubic bezier curve
                const prevX = getX(idx - 1);
                const prevY = getY(values[idx - 1]);
                const cpx1 = prevX + (x - prevX) / 2;
                const cpx2 = cpx1;
                d += ` C ${cpx1} ${prevY}, ${cpx2} ${y}, ${x} ${y}`;
              }
            });

            return (
              <g key={s.year}>
                <path
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-300 hover:stroke-[3.5]"
                />
                {/* Data points */}
                {values.map((v, idx) => {
                  const isHoveredMonth = hoveredMonthIdx === idx;
                  return (
                    <circle
                      key={idx}
                      cx={getX(idx)}
                      cy={getY(v)}
                      r={isHoveredMonth ? 5 : 3}
                      fill={s.color}
                      stroke={theme.bgCard}
                      strokeWidth="2"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Transparent interactive columns for hover scrubbing */}
          {MONTH_NAMES.map((_, i) => {
            const colW = innerWidth / 11;
            const xLeft = getX(i) - colW / 2;
            return (
              <rect
                key={i}
                x={xLeft}
                y={padding.top}
                width={colW}
                height={innerHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredMonthIdx(i)}
                onMouseLeave={() => setHoveredMonthIdx(null)}
              />
            );
          })}
        </svg>
      </div>

      {/* Hover Month Breakdown Card */}
      {hoveredMonthIdx !== null && (
        <div 
          className="mt-4 p-4 rounded-xl border animate-in fade-in"
          style={{
            backgroundColor: theme.isDark ? '#0d1117' : '#f8fafc',
            borderColor: theme.border,
          }}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b" style={{ borderColor: theme.border }}>
            <span className="text-xs font-bold" style={{ color: theme.textPrimary }}>
              Breakdown for {MONTH_NAMES[hoveredMonthIdx]} ({chartMode === 'cumulative' ? 'Cumulative Progress by Month-End' : 'Monthly Contributions'})
            </span>
            <span className="text-[11px] font-mono" style={{ color: theme.textMuted }}>
              Across {yearSeries.length} years
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {yearSeries
              .sort((a, b) => {
                const valA = chartMode === 'cumulative' ? a.cumulative[hoveredMonthIdx] : a.monthly[hoveredMonthIdx];
                const valB = chartMode === 'cumulative' ? b.cumulative[hoveredMonthIdx] : b.monthly[hoveredMonthIdx];
                return valB - valA;
              })
              .map((s) => {
                const val = chartMode === 'cumulative' ? s.cumulative[hoveredMonthIdx] : s.monthly[hoveredMonthIdx];
                return (
                  <div key={s.year} className="flex items-center justify-between p-2 rounded-lg border text-xs" style={{ borderColor: theme.border }}>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="font-semibold" style={{ color: theme.textPrimary }}>{s.year}</span>
                    </div>
                    <span className="font-mono font-bold tabular-nums" style={{ color: s.color }}>
                      {formatNum(val)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
