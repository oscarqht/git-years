export interface ContributionDay {
  date: string; // 'YYYY-MM-DD'
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface RawContributionsData {
  total: Record<string, number>;
  contributions: ContributionDay[];
}

export interface GitHubUserProfile {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
  created_at?: string;
  location?: string | null;
  company?: string | null;
  blog?: string | null;
}

export interface YearStats {
  year: number;
  total: number;
  days: ContributionDay[];
  weeks: (ContributionDay | null)[][]; // 53 weeks, each 7 days (0: Sun to 6: Sat)
  maxDayCount: number;
  activeDays: number;
  longestStreak: number;
  avgPerDay: number;
  avgPerActiveDay: number;
  weekendContribs: number;
  weekdayContribs: number;
  peakDay: ContributionDay | null;
  monthlyTotals: number[]; // 12 elements (Jan: 0, Dec: 11)
}

export interface LifetimeStats {
  totalContributions: number;
  totalDays: number;
  totalActiveDays: number;
  longestStreak: { days: number; startDate: string; endDate: string };
  currentStreak: { days: number; startDate: string };
  bestDay: { date: string; count: number };
  bestYear: { year: number; total: number };
  weekdayTotal: number;
  weekendTotal: number;
  yearsCount: number;
  avgPerYear: number;
}

export type ColorThemeKey = 'github-dark' | 'github-light' | 'emerald' | 'ocean' | 'sunset' | 'purple' | 'monochrome';

export interface ThemeColors {
  name: string;
  key: ColorThemeKey;
  isDark: boolean;
  bgCanvas: string;
  bgCard: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  levels: [string, string, string, string, string]; // level 0, 1, 2, 3, 4
  levelLabels: [string, string, string, string, string];
  accent: string;
}

export type ViewMode = 'stacked' | 'overlay' | 'annual' | 'stream' | 'seasonality';
