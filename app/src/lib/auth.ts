// Client-side session auth. On connect, the wallet signs a timestamped session
// message; we reuse that signature both to derive the ECIES key and as a bearer
// token (x-aeon-auth) the server verifies (see api/_lib/guard.ts). One signature,
// no extra MetaMask popups.
let token = "";

export const sessionMessage = (issuedAt: number) => `Aeon session\nissued:${issuedAt}`;

export function buildAuthToken(address: string, issuedAt: number, signature: string): string {
  return btoa(JSON.stringify({ address, issuedAt, signature }));
}

export function setAuthToken(t: string) {
  token = t;
}

export function authHeaders(): Record<string, string> {
  return token ? { "x-aeon-auth": token } : {};
}
