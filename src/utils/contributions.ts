import { ContributionDay, YearStats, LifetimeStats } from '../types';

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Groups raw contribution days by year and calculates calendar week grids and metrics.
 */
export function processContributions(
  contributions: ContributionDay[],
  yearTotalsMap?: Record<string, number>
): {
  years: YearStats[];
  lifetime: LifetimeStats;
  allDaysChronological: ContributionDay[];
} {
  // Sort chronological (oldest to newest)
  const sortedDays = [...contributions].sort((a, b) => a.date.localeCompare(b.date));

  // Group by year
  const daysByYear: Record<number, ContributionDay[]> = {};
  for (const day of sortedDays) {
    const year = parseInt(day.date.slice(0, 4), 10);
    if (!daysByYear[year]) {
      daysByYear[year] = [];
    }
    daysByYear[year].push(day);
  }

  const processedYears: YearStats[] = [];

  const yearKeys = Object.keys(daysByYear)
    .map(Number)
    .sort((a, b) => b - a); // descending by default (e.g. 2026, 2025...)

  for (const year of yearKeys) {
    const days = daysByYear[year];
    let total = yearTotalsMap?.[String(year)] ?? 0;
    if (!total) {
      total = days.reduce((sum, d) => sum + d.count, 0);
    }

    let maxDayCount = 0;
    let activeDays = 0;
    let weekendContribs = 0;
    let weekdayContribs = 0;
    let peakDay: ContributionDay | null = null;
    const monthlyTotals = new Array(12).fill(0);

    // Build 53-week grid for the year
    // Each week is array of 7 items (index 0 = Sun, index 6 = Sat)
    const weeks: (ContributionDay | null)[][] = [];
    let currentWeek: (ContributionDay | null)[] = [];

    // Map by date string for fast lookup
    const dayMap = new Map<string, ContributionDay>();
    for (const d of days) {
      dayMap.set(d.date, d);
      if (d.count > maxDayCount) {
        maxDayCount = d.count;
        peakDay = d;
      }
      if (d.count > 0) {
        activeDays++;
      }

      // Month accumulation
      const monthIdx = parseInt(d.date.slice(5, 7), 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        monthlyTotals[monthIdx] += d.count;
      }

      // Day of week
      const dateObj = new Date(d.date + 'T00:00:00Z');
      const dayOfWeek = dateObj.getUTCDay(); // 0 is Sunday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendContribs += d.count;
      } else {
        weekdayContribs += d.count;
      }
    }

    // Generate accurate 53-week structure starting Jan 1 of that year
    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year, 11, 31));
    const startDayOfWeek = startDate.getUTCDay(); // 0..6

    // Prepend nulls for days before Jan 1 in the first week
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // Iterate through all days of the year
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const dateStr = cur.toISOString().slice(0, 10);
      const existing = dayMap.get(dateStr);
      const item: ContributionDay = existing || {
        date: dateStr,
        count: 0,
        level: 0,
      };

      currentWeek.push(item);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    // Pad trailing days in the last week with null
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    // Calculate longest streak in this year
    let longestStreak = 0;
    let tempStreak = 0;
    for (const d of days) {
      if (d.count > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    const avgPerDay = days.length > 0 ? Number((total / days.length).toFixed(2)) : 0;
    const avgPerActiveDay = activeDays > 0 ? Number((total / activeDays).toFixed(1)) : 0;

    processedYears.push({
      year,
      total,
      days,
      weeks,
      maxDayCount,
      activeDays,
      longestStreak,
      avgPerDay,
      avgPerActiveDay,
      weekendContribs,
      weekdayContribs,
      peakDay,
      monthlyTotals,
    });
  }

  // Calculate lifetime stats
  let totalContribs = 0;
  let totalActiveDays = 0;
  let allTimeLongestStreak = { days: 0, startDate: '', endDate: '' };
  let currentStreak = { days: 0, startDate: '' };
  let bestDay = { date: '', count: 0 };
  let bestYear = { year: 0, total: 0 };
  let lifetimeWeekday = 0;
  let lifetimeWeekend = 0;

  // Streak tracking across full chronological timeline
  let streakCount = 0;
  let streakStart = '';
  for (let i = 0; i < sortedDays.length; i++) {
    const day = sortedDays[i];
    totalContribs += day.count;

    if (day.count > 0) {
      totalActiveDays++;
      if (streakCount === 0) {
        streakStart = day.date;
      }
      streakCount++;
      if (streakCount > allTimeLongestStreak.days) {
        allTimeLongestStreak = {
          days: streakCount,
          startDate: streakStart,
          endDate: day.date,
        };
      }
    } else {
      streakCount = 0;
    }

    if (day.count > bestDay.count) {
      bestDay = { date: day.date, count: day.count };
    }

    const dObj = new Date(day.date + 'T00:00:00Z');
    const dow = dObj.getUTCDay();
    if (dow === 0 || dow === 6) {
      lifetimeWeekend += day.count;
    } else {
      lifetimeWeekday += day.count;
    }
  }

  // Current streak (from most recent days backwards)
  let curStreakCount = 0;
  let curStreakStart = '';
  // Check if today or yesterday had contributions
  let foundFirstActive = false;
  for (let i = sortedDays.length - 1; i >= 0; i--) {
    const d = sortedDays[i];
    if (d.count > 0) {
      foundFirstActive = true;
      curStreakCount++;
      curStreakStart = d.date;
    } else if (foundFirstActive) {
      // Streak broken
      break;
    }
  }
  currentStreak = { days: curStreakCount, startDate: curStreakStart };

  // Best year
  for (const y of processedYears) {
    if (y.total > bestYear.total) {
      bestYear = { year: y.year, total: y.total };
    }
  }

  const lifetime: LifetimeStats = {
    totalContributions: totalContribs,
    totalDays: sortedDays.length,
    totalActiveDays,
    longestStreak: allTimeLongestStreak,
    currentStreak,
    bestDay,
    bestYear,
    weekdayTotal: lifetimeWeekday,
    weekendTotal: lifetimeWeekend,
    yearsCount: processedYears.length,
    avgPerYear: processedYears.length > 0 ? Math.round(totalContribs / processedYears.length) : 0,
  };

  return {
    years: processedYears,
    lifetime,
    allDaysChronological: sortedDays,
  };
}

/**
 * Returns month header markers and column indexes (0-52) for standard 53-week display
 */
export function getMonthColumns(): { name: string; colIndex: number }[] {
  // Approximate week index where each month starts in standard year
  return [
    { name: 'Jan', colIndex: 0 },
    { name: 'Feb', colIndex: 4 },
    { name: 'Mar', colIndex: 8 },
    { name: 'Apr', colIndex: 13 },
    { name: 'May', colIndex: 17 },
    { name: 'Jun', colIndex: 21 },
    { name: 'Jul', colIndex: 26 },
    { name: 'Aug', colIndex: 30 },
    { name: 'Sep', colIndex: 35 },
    { name: 'Oct', colIndex: 39 },
    { name: 'Nov', colIndex: 43 },
    { name: 'Dec', colIndex: 48 },
  ];
}

/**
 * Format date nicely: "Wednesday, October 14, 2026"
 */
export function formatFullDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00Z');
    return d.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a number with comma separators (e.g. 3356 -> "3,356")
 */
export function formatNum(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}
