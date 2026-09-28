import defaultSnapshot from '../data/defaultData.json';
import { RawContributionsData, GitHubUserProfile } from '../types';

const API_BASE = 'https://github-contributions-api.jogruber.de/v4';

interface UserDataResult {
  profile: GitHubUserProfile;
  contributionsData: RawContributionsData;
}

export async function fetchGitHubUserData(username: string): Promise<UserDataResult> {
  const cleanUsername = username.trim().toLowerCase();

  // If requesting oscarqht and we have default data snapshot, we can use it or re-fetch
  const cacheKey = `gityears_${cleanUsername}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.profile && parsed.contributionsData) {
        return parsed;
      }
    }
  } catch {
    // sessionStorage not available or parsing failed
  }

  // If oscarqht, use bundled snapshot as initial fallback
  if (cleanUsername === 'oscarqht' && defaultSnapshot?.contribs && defaultSnapshot?.user) {
    const defaultData: UserDataResult = {
      profile: defaultSnapshot.user as GitHubUserProfile,
      contributionsData: defaultSnapshot.contribs as RawContributionsData,
    };
    return defaultData;
  }

  // Fetch live contributions
  const contribPromise = fetch(`${API_BASE}/${cleanUsername}?y=all`)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch contribution data (HTTP ${res.status})`);
      }
      return (await res.json()) as RawContributionsData;
    });

  // Fetch GitHub user profile
  const profilePromise = fetch(`https://api.github.com/users/${cleanUsername}`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
  })
    .then(async (res) => {
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`User "${cleanUsername}" was not found on GitHub.`);
        }
        // If rate limited, construct minimal profile
        return {
          login: cleanUsername,
          name: cleanUsername,
          bio: 'GitHub Developer',
          avatar_url: `https://github.com/${cleanUsername}.png`,
          public_repos: 0,
          followers: 0,
          following: 0,
          html_url: `https://github.com/${cleanUsername}`,
        } as GitHubUserProfile;
      }
      return (await res.json()) as GitHubUserProfile;
    })
    .catch(() => {
      // Fallback profile if rate limited or blocked
      return {
        login: cleanUsername,
        name: cleanUsername,
        bio: 'GitHub Developer',
        avatar_url: `https://github.com/${cleanUsername}.png`,
        public_repos: 0,
        followers: 0,
        following: 0,
        html_url: `https://github.com/${cleanUsername}`,
      } as GitHubUserProfile;
    });

  const [contributionsData, profile] = await Promise.all([contribPromise, profilePromise]);

  const result: UserDataResult = {
    profile,
    contributionsData,
  };

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(result));
  } catch {
    // quota exceeded or disabled
  }

  return result;
}

export function getDefaultOscarData(): UserDataResult {
  return {
    profile: defaultSnapshot.user as GitHubUserProfile,
    contributionsData: defaultSnapshot.contribs as RawContributionsData,
  };
}
