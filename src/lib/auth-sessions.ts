export type AuthPortal = 'dashboard' | 'team' | 'citizen';

const LEGACY_TOKEN_KEY = 'aegisflow_token';
const TOKEN_PREFIX = 'aegisflow_token_';

export const PORTAL_SIGNIN_PATH: Record<AuthPortal, string> = {
  dashboard: '/signin/city-admin',
  team: '/signin/rescue-team',
  citizen: '/signin/citizen',
};

export function getPortalForPath(pathname: string): AuthPortal | null {
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/team')) return 'team';
  if (pathname.startsWith('/citizen')) return 'citizen';
  return null;
}

export function getPortalForRole(role?: string): AuthPortal {
  if (role === 'rescue_team') return 'team';
  if (role === 'citizen') return 'citizen';
  return 'dashboard';
}

export function getTokenKey(portal: AuthPortal): string {
  return `${TOKEN_PREFIX}${portal}`;
}

export function getPortalToken(portal: AuthPortal | null): string | null {
  if (typeof window === 'undefined' || !portal) return null;

  return localStorage.getItem(getTokenKey(portal));
}

export function setPortalToken(portal: AuthPortal, token: string): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(getTokenKey(portal), token);

  if (portal === 'dashboard') {
    document.cookie = `${getTokenKey(portal)}=${token}; path=/; max-age=86400; SameSite=Lax`;
  }
}

export function clearPortalToken(portal: AuthPortal | null): void {
  if (typeof window === 'undefined' || !portal) return;

  localStorage.removeItem(getTokenKey(portal));
  if (portal === 'dashboard') {
    document.cookie = `${getTokenKey(portal)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

export function migrateLegacyToken(portal: AuthPortal | null): string | null {
  if (typeof window === 'undefined' || !portal) return null;

  const portalToken = getPortalToken(portal);
  if (portalToken) return portalToken;

  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
  if (!legacyToken) return null;

  setPortalToken(portal, legacyToken);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  document.cookie = `${LEGACY_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

  return legacyToken;
}
