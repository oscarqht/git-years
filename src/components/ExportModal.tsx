import React, { useState } from 'react';
import { YearStats, GitHubUserProfile, ThemeColors } from '../types';
import { formatNum } from '../utils/contributions';
import { X, FileJson, FileSpreadsheet, Copy, Check, Image as ImageIcon, BarChart3, CheckSquare, Square } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  years: YearStats[];
  selectedYears: number[];
  profile: GitHubUserProfile | null;
  theme: ThemeColors;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  years,
  selectedYears,
  profile,
  theme,
}) => {
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [includeGrowthChart, setIncludeGrowthChart] = useState(true);
  const [includeHeatmap, setIncludeHeatmap] = useState(true);

  if (!isOpen) return null;

  const displayedYears = years
    .filter((y) => selectedYears.includes(y.year))
    .sort((a, b) => b.year - a.year);

  // Chronological order for growth calculations
  const chronologicalYears = [...displayedYears].sort((a, b) => a.year - b.year);

  const totalContributions = displayedYears.reduce((sum, y) => sum + y.total, 0);

  // Export as PNG via canvas (retina 2x scale)
  const handleExportPNG = () => {
    setIsExportingImage(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cellSize = 12;
      const gap = 3;
      const numWeeks = 53;
      const gridWidth = numWeeks * (cellSize + gap);
      const rowHeight = 7 * (cellSize + gap);
      const rowGap = 16;
      const padding = 36;
      const yearColWidth = 140;

      const headerHeight = 110;
      const growthChartHeight = includeGrowthChart ? 240 : 0;
      const heatmapHeight = includeHeatmap ? displayedYears.length * (rowHeight + rowGap) + 50 : 0;
      const sectionGap = (includeGrowthChart && includeHeatmap) ? 36 : 0;
      const footerHeight = 40;

      const contentWidth = Math.max(gridWidth + yearColWidth, 760);
      const canvasWidth = padding * 2 + contentWidth;
      const canvasHeight = padding * 2 + headerHeight + growthChartHeight + sectionGap + heatmapHeight + footerHeight;

      // Scale for retina display (2x)
      const scale = 2;
      canvas.width = canvasWidth * scale;
      canvas.height = canvasHeight * scale;
      ctx.scale(scale, scale);

      // Background
      ctx.fillStyle = theme.bgCard;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Outer Border
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2);

      // Header Block
      ctx.fillStyle = theme.textPrimary;
      ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
      const title = profile ? `${profile.name || profile.login}'s GitHub Contributions Report` : 'GitHub Multi-Year Contributions';
      ctx.fillText(title, padding, padding + 26);

      ctx.fillStyle = theme.textMuted;
      ctx.font = '13px "JetBrains Mono", monospace';
      const earliestYear = chronologicalYears[0]?.year;
      const latestYear = chronologicalYears[chronologicalYears.length - 1]?.year;
      const dateRangeStr = earliestYear ? `(${earliestYear} - ${latestYear})` : '';
      ctx.fillText(
        `${formatNum(totalContributions)} total contributions across ${displayedYears.length} selected years ${dateRangeStr}`,
        padding,
        padding + 52
      );

      // Header Divider
      ctx.strokeStyle = theme.border;
      ctx.beginPath();
      ctx.moveTo(padding, padding + 74);
      ctx.lineTo(canvasWidth - padding, padding + 74);
      ctx.stroke();

      ctx.fillStyle = theme.textMuted;
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(`Generated with GitYears · https://github.com/${profile?.login || ''}`, padding, padding + 96);

      let curY = padding + headerHeight;

      // 1. Draw "Year-over-Year Growth & Lifetime Trajectory" Bar Chart
      if (includeGrowthChart) {
        // Section Title
        ctx.fillStyle = theme.textPrimary;
        ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Year-over-Year Growth & Annual Distribution', padding, curY + 16);

        ctx.fillStyle = theme.textMuted;
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText('Annual contribution volume and YoY growth trajectory', padding, curY + 34);

        const chartTop = curY + 54;
        const chartPlotHeight = 120;
        const chartWidth = contentWidth;
        const chartBottom = chartTop + chartPlotHeight;

        // Base line
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, chartBottom);
        ctx.lineTo(padding + chartWidth, chartBottom);
        ctx.stroke();

        const maxAnnual = Math.max(...chronologicalYears.map((y) => y.total), 1);
        const barSlotWidth = chartWidth / Math.max(chronologicalYears.length, 1);
        const barActualWidth = Math.min(Math.max(barSlotWidth * 0.55, 12), 36);

        chronologicalYears.forEach((y, idx) => {
          const xCenter = padding + idx * barSlotWidth + barSlotWidth / 2;
          const barHeight = Math.max((y.total / maxAnnual) * (chartPlotHeight - 20), y.total > 0 ? 4 : 2);
          const barTop = chartBottom - barHeight;
          const isMax = y.total === maxAnnual && y.total > 0;

          // Bar fill
          ctx.fillStyle = isMax ? '#10b981' : (y.total > 0 ? theme.levels[3] : (theme.isDark ? '#21262d' : '#e2e8f0'));
          ctx.beginPath();
          ctx.roundRect(xCenter - barActualWidth / 2, barTop, barActualWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();

          // Value above bar
          if (y.total > 0) {
            ctx.fillStyle = isMax ? '#eab308' : theme.textPrimary;
            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(formatNum(y.total), xCenter, barTop - 5);
          }

          // Year label below bar
          ctx.fillStyle = theme.textMuted;
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${String(y.year).slice(2)}'`, xCenter, chartBottom + 16);
        });

        // Reset text align
        ctx.textAlign = 'start';

        curY += growthChartHeight;
      }

      if (includeGrowthChart && includeHeatmap) {
        // Divider between sections
        ctx.strokeStyle = theme.border;
        ctx.beginPath();
        ctx.moveTo(padding, curY + 12);
        ctx.lineTo(canvasWidth - padding, curY + 12);
        ctx.stroke();

        curY += sectionGap;
      }

      // 2. Draw Multi-Year Heatmap Grid
      if (includeHeatmap) {
        // Section Title
        ctx.fillStyle = theme.textPrimary;
        ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Multi-Year Contribution Heatmap Matrix', padding, curY + 16);

        ctx.fillStyle = theme.textMuted;
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText('Synchronized week-by-week calendar heatmaps', padding, curY + 34);

        curY += 50;

        displayedYears.forEach((yearObj) => {
          // Year Label & Total
          ctx.fillStyle = theme.textPrimary;
          ctx.font = 'bold 14px "JetBrains Mono", monospace';
          ctx.fillText(String(yearObj.year), padding, curY + 22);

          ctx.fillStyle = yearObj.total > 0 ? theme.accent : theme.textMuted;
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          ctx.fillText(`${formatNum(yearObj.total)} contribs`, padding, curY + 38);

          ctx.fillStyle = theme.textMuted;
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText(`${yearObj.activeDays} active days`, padding, curY + 52);

          // Heatmap cells
          const startX = padding + yearColWidth;

          yearObj.weeks.forEach((week, wIdx) => {
            week.forEach((day, dIdx) => {
              if (!day) return;
              const x = startX + wIdx * (cellSize + gap);
              const y = curY + dIdx * (cellSize + gap);

              ctx.fillStyle = theme.levels[day.level];
              ctx.beginPath();
              ctx.roundRect(x, y, cellSize, cellSize, 2);
              ctx.fill();

              if (day.level === 0) {
                ctx.strokeStyle = theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            });
          });

          curY += rowHeight + rowGap;
        });
      }

      // Watermark / footer
      ctx.fillStyle = theme.textMuted;
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('GitYears · Multi-Year GitHub Activity Matrix', padding, canvasHeight - padding / 2);

      // Trigger download
      const link = document.createElement('a');
      link.download = `${profile?.login || 'github'}-contributions-${displayedYears.length}-years.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('PNG export failed', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  // Export as CSV
  const handleExportCSV = () => {
    const rows = ['Date,Year,Contributions,Level'];
    displayedYears.forEach((y) => {
      y.days.forEach((d) => {
        rows.push(`${d.date},${y.year},${d.count},${d.level}`);
      });
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile?.login || 'github'}-contributions.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export as JSON
  const handleExportJSON = () => {
    const data = {
      user: profile?.login,
      exportedAt: new Date().toISOString(),
      totalContributions,
      years: displayedYears.map((y) => ({
        year: y.year,
        total: y.total,
        activeDays: y.activeDays,
        days: y.days,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile?.login || 'github'}-contributions.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Markdown badge snippet
  const markdownSnippet = `[![${profile?.login}'s GitYears Contributions](https://img.shields.io/badge/Lifetime_Contributions-${formatNum(totalContributions)}-2ea44f?style=flat-square&logo=github)](https://github.com/${profile?.login})`;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownSnippet);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 transition-all"
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.border,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b mb-5" style={{ borderColor: theme.border }}>
          <h3 className="text-base font-bold" style={{ color: theme.textPrimary }}>
            Export Multi-Year Contributions
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg border transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ borderColor: theme.border, color: theme.textMuted }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* PNG High-Res Image Export */}
          <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: theme.border, backgroundColor: theme.isDark ? '#0d1117' : '#ffffff' }}>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-sm font-bold flex items-center gap-2" style={{ color: theme.textPrimary }}>
                  <ImageIcon className="w-4 h-4" style={{ color: theme.accent }} />
                  <span>High-Resolution PNG Chart</span>
                </div>
                <p className="text-xs" style={{ color: theme.textMuted }}>
                  Render retina 2× graphic with your selected {displayedYears.length} years
                </p>
              </div>
              <button
                onClick={handleExportPNG}
                disabled={isExportingImage || (!includeGrowthChart && !includeHeatmap)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer shrink-0"
                style={{ backgroundColor: theme.accent }}
              >
                {isExportingImage ? 'Generating...' : 'Save PNG'}
              </button>
            </div>

            {/* PNG Include Checkbox Options */}
            <div className="pt-2 border-t flex flex-wrap items-center gap-4 text-xs font-mono" style={{ borderColor: theme.border }}>
              <button
                type="button"
                onClick={() => setIncludeGrowthChart(!includeGrowthChart)}
                className="flex items-center gap-1.5 cursor-pointer select-none"
                style={{ color: includeGrowthChart ? theme.textPrimary : theme.textMuted }}
              >
                {includeGrowthChart ? (
                  <CheckSquare className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                <span>Include Year-over-Year Growth Chart</span>
              </button>

              <button
                type="button"
                onClick={() => setIncludeHeatmap(!includeHeatmap)}
                className="flex items-center gap-1.5 cursor-pointer select-none"
                style={{ color: includeHeatmap ? theme.textPrimary : theme.textMuted }}
              >
                {includeHeatmap ? (
                  <CheckSquare className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                <span>Include Multi-Year Heatmap</span>
              </button>
            </div>
          </div>

          {/* Raw Data Exports (CSV & JSON) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportCSV}
              className="p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ borderColor: theme.border, backgroundColor: theme.isDark ? '#0d1117' : '#ffffff' }}
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-bold" style={{ color: theme.textPrimary }}>Download CSV</span>
              <span className="text-[10px]" style={{ color: theme.textMuted }}>Spreadsheet data</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ borderColor: theme.border, backgroundColor: theme.isDark ? '#0d1117' : '#ffffff' }}
            >
              <FileJson className="w-5 h-5 text-cyan-500" />
              <span className="text-xs font-bold" style={{ color: theme.textPrimary }}>Download JSON</span>
              <span className="text-[10px]" style={{ color: theme.textMuted }}>Developer schema</span>
            </button>
          </div>

          {/* GitHub README Badge Snippet */}
          <div className="p-3.5 rounded-xl border space-y-2" style={{ borderColor: theme.border, backgroundColor: theme.isDark ? '#0d1117' : '#ffffff' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: theme.textPrimary }}>GitHub README Badge</span>
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1 text-xs font-medium cursor-pointer"
                style={{ color: theme.accent }}
              >
                {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMarkdown ? 'Copied!' : 'Copy Markdown'}</span>
              </button>
            </div>
            <pre 
              className="p-2 rounded-lg text-[11px] font-mono overflow-x-auto select-all border"
              style={{
                backgroundColor: theme.isDark ? '#161b22' : '#f6f8fa',
                borderColor: theme.border,
                color: theme.textMuted,
              }}
            >
              {markdownSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t flex justify-end" style={{ borderColor: theme.border }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer"
            style={{ borderColor: theme.border, color: theme.textPrimary }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
