import { useState, useEffect } from 'react';
import { fallbackReadme } from '../data/fallback';

const README_URL = 'https://raw.githubusercontent.com/UNN-Devotek/Arcwright-AI/main/README.md';
const CACHE_KEY = 'arcwright_readme_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  content: string;
  timestamp: number;
}

export interface ReadmeState {
  content: string;
  timestamp: string | null;
  loading: boolean;
  error: string | null;
}

export function useGitHubReadme(): ReadmeState {
  const [state, setState] = useState<ReadmeState>({
    content: fallbackReadme,
    timestamp: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchReadme() {
      // Check sessionStorage cache
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
            setState({
              content: entry.content,
              timestamp: new Date(entry.timestamp).toLocaleString(),
              loading: false,
              error: null,
            });
            return;
          }
        }
      } catch {
        // sessionStorage unavailable — continue to fetch
      }

      try {
        const res = await fetch(README_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const now = Date.now();

        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ content: text, timestamp: now } satisfies CacheEntry),
          );
        } catch {
          // Storage quota exceeded — continue without caching
        }

        setState({
          content: text,
          timestamp: new Date(now).toLocaleString(),
          loading: false,
          error: null,
        });
      } catch (err) {
        setState({
          content: fallbackReadme,
          timestamp: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch README',
        });
      }
    }

    fetchReadme();
  }, []);

  return state;
}
