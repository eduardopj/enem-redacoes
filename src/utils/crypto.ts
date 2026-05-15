const APP_PEPPER = process.env.EXPO_PUBLIC_APP_PEPPER ?? 'enem-redacoes-v3-2025';

// Pure-JS fallback hash (FNV-1a 32-bit, 8 rounds → 64 hex chars).
// Used when Web Crypto API is unavailable (Hermes on older Android).
function fnvHash(str: string): string {
  const rounds = 8;
  const seeds = [0x811c9dc5, 0x6b43a9b5, 0xdeadbeef, 0xcafebabe,
                 0x01234567, 0x89abcdef, 0xfedcba98, 0x76543210];
  const state = [...seeds];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    for (let j = 0; j < rounds; j++) {
      state[j] = (((state[j] ^ c) * 0x01000193) >>> 0) ^ (state[(j + 1) % rounds] >>> 1);
    }
  }
  // 1000 mixing rounds to slow brute-force
  for (let i = 0; i < 1000; i++) {
    for (let j = 0; j < rounds; j++) {
      state[j] = (((state[j] ^ state[(j + 1) % rounds]) * 0x01000193 + i) >>> 0);
    }
  }
  return state.map((n) => (n >>> 0).toString(16).padStart(8, '0')).join('');
}

export async function hashPassword(password: string, emailSalt: string): Promise<string> {
  const input = `${APP_PEPPER}:${emailSalt.toLowerCase().trim()}:${password}`;
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return fnvHash(input);
  }
}

export async function verifyPassword(
  password: string,
  emailSalt: string,
  storedHash: string
): Promise<boolean> {
  const hash = await hashPassword(password, emailSalt);
  return hash === storedHash;
}
