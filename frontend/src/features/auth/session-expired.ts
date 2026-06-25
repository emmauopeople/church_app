let notificationActive = false;

export const sessionExpiredMessage = 'Votre session a expire. Cliquez sur OK pour vous reconnecter.';

export function notifySessionExpired() {
  if (notificationActive) {
    return;
  }

  notificationActive = true;
  window.dispatchEvent(new CustomEvent('church:session-expired'));
}

export function resetSessionExpiredNotification() {
  notificationActive = false;
}

export function isSessionExpiredError(error: unknown) {
  return error instanceof Error && error.message === sessionExpiredMessage;
}
