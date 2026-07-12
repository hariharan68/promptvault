// The access token lives in memory only — never localStorage/sessionStorage — so
// an XSS payload or rogue extension cannot exfiltrate a persisted credential. On
// every page load the app calls POST /auth/refresh; the httpOnly cookie is the
// only thing that survives a reload.
//
// authEpoch is a monotonically increasing guard. beginLogout() bumps it, so any
// in-flight refresh that resolves *after* a logout is silently dropped instead of
// resurrecting the session (see setToken).
let inMemoryToken = null;
let authEpoch = 0;

export const getToken = () => inMemoryToken;
export const currentEpoch = () => authEpoch;

export function setToken(token, epoch) {
  // Only accept the write if the epoch it started under is still current.
  if (epoch === authEpoch) {
    inMemoryToken = token;
  }
}

export function beginLogout() {
  authEpoch += 1;
  inMemoryToken = null;
  return authEpoch;
}
