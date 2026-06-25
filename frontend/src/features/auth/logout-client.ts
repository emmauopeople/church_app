import { config } from '../../lib/config';
import { getAccessToken } from './auth.storage';

export async function recordLogout() {
  const token = getAccessToken();

  if (!token) return;

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);

  await fetch(`${config.authApiUrl}/auth/logout`, {
    method: 'POST',
    headers,
  }).catch(() => null);
}
