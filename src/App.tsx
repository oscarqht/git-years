/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  GitHubUserProfile, 
  RawContributionsData, 
  ViewMode, 
  ColorThemeKey 
} from './types';
import { processContributions } from './utils/contributions';
import { THEMES } from './utils/theme';
import { fetchGitHubUserData, getDefaultOscarData } from './services/github';

import { Header } from './components/Header';
import { UserSearchBanner } from './components/UserSearchBanner';
import { LifetimeStatsBar } from './components/LifetimeStatsBar';
import { YearSelectorBar } from './components/YearSelectorBar';
import { MultiYearStackedHeatmap } from './components/MultiYearStackedHeatmap';
import { MultiYearComparisonOverlay } from './components/MultiYearComparisonOverlay';
import { AnnualGrowthBarChart } from './components/AnnualGrowthBarChart';
import { ContinuousTimelineRibbon } from './components/ContinuousTimelineRibbon';
import { SeasonalityMatrix } from './components/SeasonalityMatrix';
import { ExportModal } from './components/ExportModal';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [username, setUsername] = useState('oscarqht');
  const [profile, setProfile] = useState<GitHubUserProfile | null>(() => getDefaultOscarData().profile);
  const [contributionsData, setContributionsData] = useState<RawContributionsData>(() => getDefaultOscarData().contributionsData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customization & View State
  const [currentView, setCurrentView] = useState<ViewMode>('stacked');
  const [currentThemeKey, setCurrentThemeKey] = useState<ColorThemeKey>('github-dark');
  const [cellSize, setCellSize] = useState<number>(11);
  const [isDescending, setIsDescending] = useState<boolean>(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Process data with memoization
  const processed = useMemo(() => {
    return processContributions(contributionsData.contributions, contributionsData.total);
  }, [contributionsData]);

  // Selected years (defaults to all available years)
  const [selectedYears, setSelectedYears] = useState<number[]>(() => {
    const defaultData = getDefaultOscarData();
    const initialProcessed = processContributions(defaultData.contributionsData.contributions, defaultData.contributionsData.total);
    return initialProcessed.years.map((y) => y.year);
  });

  const theme = THEMES[currentThemeKey];

  // When processed years change, ensure selectedYears is initialized
  useEffect(() => {
    if (processed.years.length > 0) {
      setSelectedYears(processed.years.map((y) => y.year));
    }
  }, [processed.years.length, username]);

  // Handle searching a new user
  const handleSearchUser = async (newUsername: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchGitHubUserData(newUsername);
      setUsername(data.profile.login);
      setProfile(data.profile);
      setContributionsData(data.contributionsData);
    } catch (err: any) {
      setError(err?.message || `Failed to fetch data for user "${newUsername}".`);
    } finally {
      setIsLoading(false);
    }
  };

  // Year Selection Helpers
  const handleToggleYear = (year: number) => {
    setSelectedYears((prev) => 
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleSelectAll = () => {
    setSelectedYears(processed.years.map((y) => y.year));
  };

  const handleSelectActiveOnly = () => {
    setSelectedYears(processed.years.filter((y) => y.total > 0).map((y) => y.year));
  };

  const handleSelectRecent = (count: number) => {
    const sorted = [...processed.years].sort((a, b) => b.year - a.year);
    setSelectedYears(sorted.slice(0, count).map((y) => y.year));
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: theme.bgCanvas,
        color: theme.textPrimary,
      }}
    >
      {/* Top Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        currentTheme={currentThemeKey}
        onThemeChange={setCurrentThemeKey}
        onOpenExport={() => setExportModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Error notification if any */}
        {error && (
          <div 
            className="mb-6 p-4 rounded-xl border flex items-center justify-between gap-3 text-xs bg-rose-500/10 border-rose-500/30 text-rose-400 animate-in fade-in"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => handleSearchUser('oscarqht')}
              className="underline font-semibold hover:text-white cursor-pointer"
            >
              Reset to oscarqht
            </button>
          </div>
        )}

        {/* User Search & Profile Card */}
        <UserSearchBanner
          profile={profile}
          currentUsername={username}
          onSearch={handleSearchUser}
          isLoading={isLoading}
          theme={theme}
        />

        {/* Lifetime Statistics Overview Bar */}
        <LifetimeStatsBar
          stats={processed.lifetime}
          theme={theme}
        />

        {/* Year Multi-Selection & Controls Bar ("Years Included") */}
        <YearSelectorBar
          years={processed.years}
          selectedYears={selectedYears}
          onToggleYear={handleToggleYear}
          onSelectAll={handleSelectAll}
          onSelectActiveOnly={handleSelectActiveOnly}
          onSelectRecent={handleSelectRecent}
          isDescending={isDescending}
          onToggleSort={() => setIsDescending(!isDescending)}
          cellSize={cellSize}
          onCellSizeChange={setCellSize}
          theme={theme}
        />

        {/* Year-over-Year Growth & Lifetime Trajectory */}
        <AnnualGrowthBarChart
          years={processed.years}
          selectedYears={selectedYears}
          theme={theme}
        />

        {/* Active Visualization Mode */}
        {currentView === 'stacked' && (
          <MultiYearStackedHeatmap
            years={processed.years}
            selectedYears={selectedYears}
            cellSize={cellSize}
            theme={theme}
            isDescending={isDescending}
          />
        )}

        {currentView === 'overlay' && (
          <MultiYearComparisonOverlay
            years={processed.years}
            selectedYears={selectedYears}
            theme={theme}
          />
        )}

        {currentView === 'annual' && (
          <AnnualGrowthBarChart
            years={processed.years}
            selectedYears={selectedYears}
            theme={theme}
          />
        )}

        {currentView === 'stream' && (
          <ContinuousTimelineRibbon
            days={processed.allDaysChronological}
            theme={theme}
          />
        )}

        {currentView === 'seasonality' && (
          <SeasonalityMatrix
            years={processed.years}
            theme={theme}
          />
        )}

        {/* Secondary comparison section: if user is in 'stacked' view, show SeasonalityMatrix below the heatmap */}
        {currentView === 'stacked' && (
          <div className="flex flex-col gap-6 mt-6">
            <SeasonalityMatrix
              years={processed.years}
              theme={theme}
            />
          </div>
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        years={processed.years}
        selectedYears={selectedYears}
        profile={profile}
        theme={theme}
      />
    </div>
  );
}
