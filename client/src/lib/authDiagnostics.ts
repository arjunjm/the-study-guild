const AUTH_ERROR_STORAGE_KEY = 'study-guild-auth-error';

export function storeAuthError(error: unknown) {
  localStorage.setItem(AUTH_ERROR_STORAGE_KEY, getAuthErrorMessage(error));
}

export function clearAuthError() {
  localStorage.removeItem(AUTH_ERROR_STORAGE_KEY);
}

export function readAuthError() {
  return localStorage.getItem(AUTH_ERROR_STORAGE_KEY);
}

export function getAuthErrorMessage(error: unknown) {
  if (typeof error === 'object' && error) {
    const maybeError = error as { errorMessage?: unknown; message?: unknown; errorCode?: unknown };
    const details = maybeError.errorMessage ?? maybeError.message ?? maybeError.errorCode;
    if (details) return String(details);
  }
  return 'Microsoft sign-in failed. Please try again.';
}
