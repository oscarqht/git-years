import React from 'react';
import { YearStats, ThemeColors } from '../types';
import { DAY_NAMES, MONTH_NAMES, formatNum } from '../utils/contributions';
import { Calendar, BarChart2, Clock, PieChart, Sparkles } from 'lucide-react';

interface SeasonalityMatrixProps {
  years: YearStats[];
  theme: ThemeColors;
}

export const SeasonalityMatrix: React.FC<SeasonalityMatrixProps> = ({ years, theme }) => {
  // Aggregate day-of-week contributions across all years
  const dayOfWeekTotals = new Array(7).fill(0);
  const dayOfWeekCounts = new Array(7).fill(0);

  // Month totals across all years
  const monthTotals = new Array(12).fill(0);

  // Matrix of Year x DayOfWeek
  const yearByDow: { year: number; dowTotals: number[] }[] = [];

  for (const y of years) {
    const dowForYear = new Array(7).fill(0);
    for (const d of y.days) {
      const dateObj = new Date(d.date + 'T00:00:00Z');
      const dow = dateObj.getUTCDay();
      dayOfWeekTotals[dow] += d.count;
      dayOfWeekCounts[dow] += 1;
      dowForYear[dow] += d.count;

      const monthIdx = parseInt(d.date.slice(5, 7), 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        monthTotals[monthIdx] += d.count;
      }
    }
    yearByDow.push({ year: y.year, dowTotals: dowForYear });
  }

  const totalContributions = dayOfWeekTotals.reduce((a, b) => a + b, 0) || 1;
  const maxDow = Math.max(...dayOfWeekTotals, 1);
  const maxMonth = Math.max(...monthTotals, 1);

  // Peak day of week
  const peakDowIdx = dayOfWeekTotals.indexOf(maxDow);
  const peakMonthIdx = monthTotals.indexOf(maxMonth);

  const weekdayTotal = dayOfWeekTotals.slice(1, 6).reduce((a, b) => a + b, 0);
  const weekendTotal = dayOfWeekTotals[0] + dayOfWeekTotals[6];
  const weekdayPercent = Math.round((weekdayTotal / totalContributions) * 100);
  const weekendPercent = 100 - weekdayPercent;

  return (
    <div 
      className="rounded-2xl border p-4 sm:p-6 mb-6 transition-all"
      style={{
        backgroundColor: theme.bgCard,
        borderColor: theme.border,
      }}
    >
      {/* Header */}
      <div className="pb-5 border-b mb-6" style={{ borderColor: theme.border }}>
        <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: theme.textPrimary }}>
          Seasonality & Work Habit Patterns
        </h2>
        <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
          Day-of-week cadence, weekday vs weekend dedication, and calendar month peaks across all years
        </p>
      </div>

      {/* Grid of Seasonality Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of Week Distribution */}
        <div className="rounded-xl border p-4" style={{ borderColor: theme.border, backgroundColor: theme.isDark ? '#0d1117' : '#ffffff' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: theme.accent }} />
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textPrimary }}>
                Day of Week Frequency
              </h3>
            </div>
            <span className="text-xs font-mono font-medium" style={{ color: theme.accent }}>
              Peak: {DAY_NAMES[peakDowIdx]}
            </span>
          </div>

          <div className="space-y-2.5">
            {DAY_NAMES.map((name, idx) => {
              const count = dayOfWeekTotals[idx];
              const pct = ((count / totalContributions) * 100).toFixed(1);
              const barWidth = ((count / maxDow) * 100).toFixed(0);
              const isPeak = idx === peakDowIdx;

              return (
                <div key={name} className="flex items-center gap-3 text-xs">
                  <span 
                    className="w-8 font-mono font-semibold"
                    style={{ color: isPeak ? theme.accent : theme.textPrimary }}
                  >
                    {name}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${barWidth}%`, 
                        backgroundColor: isPeak ? theme.levels[4] : theme.levels[2] 
                      }}
                    />
                  </div>
                  <div className="w-24 text-right font-mono tabular-nums text-[11px]" style={{ color: theme.textMuted }}>
                    {formatNum(count)} ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weekday vs Weekend Split */}
          <div className="mt-5 pt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: theme.border }}>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.levels[3] }} />
              <span style={{ color: theme.textPrimary }}>Weekdays: <strong>{weekdayPercent}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.levels[1] }} />
              <span style={{ color: theme.textMuted }}>Weekends: <strong>{weekendPercent}%</strong></span>
            </div>
          </div>
        </div>

        {/* Monthly Seasonality Distribution */}
        <div className="rounded-xl border p-4" style={{ borderColor: theme.border, backgroundColor: theme.isDark ? '#0d1117' : '#ffffff' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: theme.accent }} />
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textPrimary }}>
                Monthly Historical Peaks
              </h3>
            </div>
            <span className="text-xs font-mono font-medium" style={{ color: theme.accent }}>
              Peak: {MONTH_NAMES[peakMonthIdx]}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {MONTH_NAMES.map((month, idx) => {
              const count = monthTotals[idx];
              const isPeak = idx === peakMonthIdx;
              const intensityLevel = count === 0 ? 0 : Math.min(4, Math.ceil((count / maxMonth) * 4));

              return (
                <div
                  key={month}
                  className="rounded-lg border p-2 flex flex-col justify-between transition-colors"
                  style={{
                    borderColor: isPeak ? theme.accent : theme.border,
                    backgroundColor: isPeak 
                      ? (theme.isDark ? 'rgba(35, 134, 54, 0.15)' : 'rgba(31, 136, 61, 0.08)')
                      : 'transparent',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono" style={{ color: isPeak ? theme.accent : theme.textPrimary }}>
                      {month}
                    </span>
                    <span 
                      className="w-2 h-2 rounded-xs" 
                      style={{ backgroundColor: theme.levels[intensityLevel] }} 
                    />
                  </div>
                  <div className="text-xs font-mono font-bold tabular-nums mt-2" style={{ color: theme.textPrimary }}>
                    {formatNum(count)}
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: theme.textMuted }}>
                    {((count / totalContributions) * 100).toFixed(1)}% of total
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
