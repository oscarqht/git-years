import React, { useState } from 'react';
import { ViewMode, ColorThemeKey } from '../types';
import { THEMES } from '../utils/theme';
import { 
  Layers, 
  LineChart, 
  BarChart3, 
  CalendarRange, 
  PieChart, 
  Download, 
  Palette,
  Github,
  Check
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  currentTheme: ColorThemeKey;
  onThemeChange: (theme: ColorThemeKey) => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  currentTheme,
  onThemeChange,
  onOpenExport,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const theme = THEMES[currentTheme];

  const viewOptions: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'stacked', label: 'All Years Matrix', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'overlay', label: 'Multi-Year Overlay', icon: <LineChart className="w-3.5 h-3.5" /> },
    { id: 'annual', label: 'YoY Growth', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'stream', label: 'Panoramic Stream', icon: <CalendarRange className="w-3.5 h-3.5" /> },
    { id: 'seasonality', label: 'Seasonality', icon: <PieChart className="w-3.5 h-3.5" /> },
  ];

  return (
    <header 
      className="sticky top-0 z-30 border-b transition-colors duration-200 backdrop-blur-md"
      style={{
        backgroundColor: theme.isDark ? 'rgba(13, 17, 23, 0.88)' : 'rgba(255, 255, 255, 0.92)',
        borderColor: theme.border,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-xs"
            style={{ backgroundColor: theme.levels[3] }}
          >
            <div className="grid grid-cols-2 gap-0.5 p-1">
              <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: theme.levels[1] }}></span>
              <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: theme.levels[4] }}></span>
              <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: theme.levels[3] }}></span>
              <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: theme.levels[2] }}></span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span 
                className="text-base font-bold tracking-tight"
                style={{ color: theme.textPrimary }}
              >
                GitYears
              </span>
              <span className="text-xs font-mono font-medium hidden sm:inline" style={{ color: theme.textMuted }}>
                multi-year matrix
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation / View Mode Tabs */}
        <nav 
          aria-label="Visualization views" 
          className="hidden md:flex items-center p-1 rounded-lg border"
          style={{ 
            backgroundColor: theme.isDark ? '#161b22' : '#f6f8fa',
            borderColor: theme.border,
          }}
        >
          {viewOptions.map((opt) => {
            const isActive = currentView === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onViewChange(opt.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer"
                style={{
                  backgroundColor: isActive 
                    ? (theme.isDark ? '#21262d' : '#ffffff')
                    : 'transparent',
                  color: isActive ? theme.textPrimary : theme.textMuted,
                  boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions (Theme, Export, GitHub) */}
        <div className="flex items-center gap-2">
          {/* Theme Palette Picker */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer"
              style={{
                backgroundColor: theme.isDark ? '#161b22' : '#ffffff',
                borderColor: theme.border,
                color: theme.textPrimary,
              }}
              title="Change Color Theme"
              aria-expanded={showThemeMenu}
            >
              <Palette className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              <span className="hidden sm:inline">{theme.name}</span>
              <div className="flex items-center gap-0.5 ml-1">
                {theme.levels.slice(1).map((color, idx) => (
                  <span
                    key={idx}
                    className="w-2 h-2 rounded-xs"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>

            {showThemeMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowThemeMenu(false)} 
                />
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-xl border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  style={{
                    backgroundColor: theme.isDark ? '#161b22' : '#ffffff',
                    borderColor: theme.border,
                  }}
                >
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold tracking-wider uppercase" style={{ color: theme.textMuted }}>
                    Color Palette
                  </div>
                  {Object.entries(THEMES).map(([key, t]) => {
                    const isSelected = key === currentTheme;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          onThemeChange(key as ColorThemeKey);
                          setShowThemeMenu(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-lg transition-colors text-left cursor-pointer"
                        style={{
                          backgroundColor: isSelected 
                            ? (t.isDark ? '#21262d' : '#f0f3f6')
                            : 'transparent',
                          color: isSelected ? t.textPrimary : (theme.isDark ? '#c9d1d9' : '#24292f'),
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {t.levels.map((c, i) => (
                              <span
                                key={i}
                                className="w-2.5 h-2.5 rounded-xs"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <span>{t.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5" style={{ color: t.accent }} />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: theme.accent }}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Chart</span>
          </button>
        </div>
      </div>

      {/* Mobile View Selector */}
      <div 
        className="flex md:hidden overflow-x-auto px-4 py-2 border-t gap-1 scrollbar-none"
        style={{ borderColor: theme.border }}
      >
        {viewOptions.map((opt) => {
          const isActive = currentView === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onViewChange(opt.id)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer"
              style={{
                backgroundColor: isActive 
                  ? (theme.isDark ? '#21262d' : '#e1e4e8')
                  : 'transparent',
                color: isActive ? theme.textPrimary : theme.textMuted,
              }}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
