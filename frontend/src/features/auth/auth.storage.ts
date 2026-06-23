import type { AuthUser } from './auth.types';

const accessTokenKey = 'church_app_access_token';
const userKey = 'church_app_user';

export function saveAuthSession(accessToken: string, user: AuthUser) {
  localStorage.setItem(accessTokenKey, accessToken);
  localStorage.setItem(userKey, JSON.stringify(user));
}

export function getAccessToken() {
  return localStorage.getItem(accessTokenKey);
}

export function getStoredUser(): AuthUser | null {
  const rawUser = localStorage.getItem(userKey);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    localStorage.removeItem(userKey);
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(accessTokenKey);
  localStorage.removeItem(userKey);
}
