export function generateCodeVerifier(): string {
  const arr = new Uint8Array(64)
  crypto.getRandomValues(arr)
  // base64url
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(digest)
  let base64 = btoa(String.fromCharCode(...bytes))
  base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return base64
}

export function generateState(): string {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

