import React from 'react';
import { LifetimeStats, ThemeColors } from '../types';
import { formatNum, formatFullDate } from '../utils/contributions';
import { 
  Flame, 
  Trophy, 
  CalendarCheck2, 
  Zap, 
  Clock, 
  Calendar,
  Activity
} from 'lucide-react';

interface LifetimeStatsBarProps {
  stats: LifetimeStats;
  theme: ThemeColors;
}

export const LifetimeStatsBar: React.FC<LifetimeStatsBarProps> = ({ stats, theme }) => {
  const consistencyPercent = stats.totalDays > 0 
    ? ((stats.totalActiveDays / stats.totalDays) * 100).toFixed(1) 
    : '0';

  const weekdayPercent = stats.totalContributions > 0
    ? Math.round((stats.weekdayTotal / stats.totalContributions) * 100)
    : 0;

  const statItems = [
    {
      label: 'Lifetime Contributions',
      value: formatNum(stats.totalContributions),
      subtext: `Across ${stats.yearsCount} tracked years (${stats.avgPerYear.toLocaleString()}/yr avg)`,
      icon: <Activity className="w-4 h-4" style={{ color: theme.accent }} />,
    },
    {
      label: 'All-Time Longest Streak',
      value: `${stats.longestStreak.days} days`,
      subtext: stats.longestStreak.startDate ? `${stats.longestStreak.startDate} → ${stats.longestStreak.endDate}` : 'No active streak',
      icon: <Flame className="w-4 h-4 text-amber-500" />,
    },
    {
      label: 'Current Streak',
      value: `${stats.currentStreak.days} days`,
      subtext: stats.currentStreak.days > 0 ? `Started ${stats.currentStreak.startDate}` : 'Not currently active',
      icon: <Clock className="w-4 h-4 text-emerald-500" />,
    },
    {
      label: 'Most Productive Year',
      value: `${stats.bestYear.year || 'N/A'}`,
      subtext: `${formatNum(stats.bestYear.total)} contributions`,
      icon: <Trophy className="w-4 h-4 text-yellow-500" />,
    },
    {
      label: 'Peak Single Day',
      value: `${stats.bestDay.count} contribs`,
      subtext: stats.bestDay.date ? stats.bestDay.date : 'None',
      icon: <Zap className="w-4 h-4 text-cyan-400" />,
    },
    {
      label: 'Active Days & Ratio',
      value: `${formatNum(stats.totalActiveDays)} days`,
      subtext: `${consistencyPercent}% active · ${weekdayPercent}% weekdays`,
      icon: <CalendarCheck2 className="w-4 h-4 text-violet-400" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {statItems.map((item, idx) => (
        <div
          key={idx}
          className="rounded-xl border p-3.5 flex flex-col justify-between transition-transform duration-150 hover:translate-y-[-1px]"
          style={{
            backgroundColor: theme.bgCard,
            borderColor: theme.border,
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold tracking-wide uppercase truncate" style={{ color: theme.textMuted }}>
              {item.label}
            </span>
            <div className="shrink-0">{item.icon}</div>
          </div>
          <div>
            <div 
              className="text-lg sm:text-xl font-bold font-mono tabular-nums tracking-tight"
              style={{ color: theme.textPrimary }}
            >
              {item.value}
            </div>
            <div 
              className="text-[11px] truncate mt-0.5" 
              style={{ color: theme.textMuted }}
              title={item.subtext}
            >
              {item.subtext}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
