import { useEffect, useState, useCallback } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'browse'; category?: string; q?: string }
  | { name: 'professional'; id: string }
  | { name: 'signin' }
  | { name: 'signup' }
  | { name: 'dashboard' }
  | { name: 'dashboard-profile' }
  | { name: 'dashboard-portfolio' }
  | { name: 'dashboard-stories' };

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const [path, queryStr] = hash.split('?');
  const params = new URLSearchParams(queryStr || '');
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 0) return { name: 'home' };
  if (segments[0] === 'explore') {
    return { name: 'browse', category: params.get('cat') || undefined, q: params.get('q') || undefined };
  }
  if (segments[0] === 'p' && segments[1]) return { name: 'professional', id: segments[1] };
  if (segments[0] === 'signin') return { name: 'signin' };
  if (segments[0] === 'signup') return { name: 'signup' };
  if (segments[0] === 'dashboard') {
    if (segments[1] === 'profile') return { name: 'dashboard-profile' };
    if (segments[1] === 'portfolio') return { name: 'dashboard-portfolio' };
    if (segments[1] === 'stories') return { name: 'dashboard-stories' };
    return { name: 'dashboard' };
  }
  return { name: 'home' };
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
  }, []);

  return { route, navigate };
}

export function buildPath(path: string): string {
  return `#${path}`;
}
