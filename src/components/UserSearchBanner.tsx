import React, { useState } from 'react';
import { GitHubUserProfile, ThemeColors } from '../types';
import { 
  Search, 
  ExternalLink, 
  Users, 
  BookMarked, 
  MapPin, 
  Briefcase, 
  Loader2,
  Sparkles
} from 'lucide-react';

interface UserSearchBannerProps {
  profile: GitHubUserProfile | null;
  currentUsername: string;
  onSearch: (username: string) => void;
  isLoading: boolean;
  theme: ThemeColors;
}

const PRESET_USERS = [
  { username: 'oscarqht', label: 'oscarqht (Author)' },
  { username: 'torvalds', label: 'Linus Torvalds' },
  { username: 'shadcn', label: 'shadcn' },
  { username: 'gaearon', label: 'Dan Abramov' },
  { username: 'yyx990803', label: 'Evan You' },
  { username: 'antfu', label: 'Anthony Fu' },
  { username: 'sindresorhus', label: 'Sindre Sorhus' },
];

export const UserSearchBanner: React.FC<UserSearchBannerProps> = ({
  profile,
  currentUsername,
  onSearch,
  isLoading,
  theme,
}) => {
  const [inputValue, setInputValue] = useState(currentUsername);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && inputValue.trim().toLowerCase() !== currentUsername.toLowerCase()) {
      onSearch(inputValue.trim());
    }
  };

  return (
    <div 
      className="rounded-2xl border p-4 sm:p-6 mb-6 transition-all"
      style={{
        backgroundColor: theme.bgCard,
        borderColor: theme.border,
      }}
    >
      {/* Search Input Bar + Preset Shortcuts */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b" style={{ borderColor: theme.border }}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-xl w-full">
          <div 
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all focus-within:ring-2 focus-within:ring-emerald-500/20"
            style={{
              backgroundColor: theme.isDark ? '#0d1117' : '#ffffff',
              borderColor: theme.border,
            }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: theme.textMuted }} />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter GitHub username (e.g. oscarqht, torvalds)..."
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-gray-400 font-medium"
              style={{ color: theme.textPrimary }}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer shrink-0"
            style={{ backgroundColor: theme.accent }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Track User</span>
              </>
            )}
          </button>
        </form>

        {/* Preset quick links */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <span className="text-xs font-medium shrink-0 mr-1" style={{ color: theme.textMuted }}>
            Try:
          </span>
          {PRESET_USERS.map((u) => {
            const isCurrent = u.username.toLowerCase() === currentUsername.toLowerCase();
            return (
              <button
                key={u.username}
                type="button"
                onClick={() => {
                  setInputValue(u.username);
                  if (u.username !== currentUsername) {
                    onSearch(u.username);
                  }
                }}
                className="px-2.5 py-1 text-xs rounded-lg border font-mono transition-colors whitespace-nowrap cursor-pointer"
                style={{
                  backgroundColor: isCurrent 
                    ? (theme.isDark ? '#21262d' : '#e2e8f0')
                    : (theme.isDark ? '#161b22' : '#ffffff'),
                  borderColor: isCurrent ? theme.accent : theme.border,
                  color: isCurrent ? theme.accent : theme.textMuted,
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {u.username}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Profile Summary Card */}
      {profile && (
        <div className="pt-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <img
                src={profile.avatar_url}
                alt={profile.login}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 shadow-sm"
                style={{ borderColor: theme.border }}
                referrerPolicy="no-referrer"
              />
              <span 
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2"
                style={{ 
                  backgroundColor: theme.levels[3],
                  borderColor: theme.bgCard 
                }}
                title="Active Contributor"
              />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 
                  className="text-lg sm:text-xl font-bold tracking-tight"
                  style={{ color: theme.textPrimary }}
                >
                  {profile.name || profile.login}
                </h1>
                <span 
                  className="text-sm font-mono"
                  style={{ color: theme.textMuted }}
                >
                  @{profile.login}
                </span>
                <a
                  href={profile.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md hover:underline font-medium"
                  style={{ color: theme.accent }}
                >
                  <span>GitHub Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {profile.bio && (
                <p 
                  className="text-xs sm:text-sm max-w-2xl line-clamp-2 leading-relaxed"
                  style={{ color: theme.textMuted }}
                >
                  {profile.bio}
                </p>
              )}

              {/* Badges / Metadata */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1" style={{ color: theme.textMuted }}>
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{profile.location}</span>
                  </span>
                )}
                {profile.company && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{profile.company}</span>
                  </span>
                )}
                <span className="flex items-center gap-1 font-mono">
                  <Users className="w-3.5 h-3.5" />
                  <span><strong>{profile.followers}</strong> followers</span>
                  <span className="mx-0.5">·</span>
                  <span><strong>{profile.following}</strong> following</span>
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <BookMarked className="w-3.5 h-3.5" />
                  <span><strong>{profile.public_repos}</strong> public repos</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
