export interface EncryptedPayload {
  salt: string;
  iv: string;
  ciphertext: string;
}

export interface PostJwtPayload {
  slug: string;
  iat: number;
  exp: number;
  auth_key: string;
}

/**
 * Convert Uint8Array to base64 string safely across Node.js and browser environments
 */
export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const len = bytes.byteLength;
  const CHUNK_SIZE = 0x8000;
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array safely across Node.js and browser environments
 */
export function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to URL-safe Base64 (RFC 7515 / JWT format)
 */
export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Convert URL-safe Base64 (JWT format) to Uint8Array
 */
export function base64UrlToBytes(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return base64ToBytes(base64);
}

/**
 * Derive AES-256 key from password and salt using PBKDF2 (100,000 rounds of SHA-256)
 */
async function deriveKey(
  password: string,
  salt: Uint8Array,
  extractable: boolean = false,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    extractable,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt plaintext (HTML string) using AES-256-GCM
 */
export async function encryptContent(
  plaintext: string,
  password: string,
): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, false);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    enc.encode(plaintext),
  );

  return {
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encryptedBuffer)),
  };
}

/**
 * Decrypt ciphertext payload using password.
 * Throws if the password is wrong or data is tampered.
 */
export async function decryptContent(
  payload: EncryptedPayload,
  password: string,
): Promise<string> {
  const salt = base64ToBytes(payload.salt);
  const iv = base64ToBytes(payload.iv);
  const ciphertext = base64ToBytes(payload.ciphertext);

  const key = await deriveKey(password, salt, false);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

/**
 * Create a signed JWT token containing the derived cryptographic key (HS256).
 * The user's plaintext password is NEVER stored inside the token.
 */
export async function createPostJwt(
  slug: string,
  password: string,
  payload: EncryptedPayload,
  days: number = 7,
): Promise<string> {
  const enc = new TextEncoder();
  const salt = base64ToBytes(payload.salt);

  // Derive extractable AES key to store inside token
  const aesKey = await deriveKey(password, salt, true);
  const rawKey = await crypto.subtle.exportKey("raw", aesKey);
  const authKeyStr = bytesToBase64Url(new Uint8Array(rawKey));

  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + days * 86400;

  const jwtPayload: PostJwtPayload = {
    slug,
    iat: now,
    exp,
    auth_key: authKeyStr,
  };

  const headerB64 = bytesToBase64Url(enc.encode(JSON.stringify(header)));
  const payloadB64 = bytesToBase64Url(enc.encode(JSON.stringify(jwtPayload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  // HMAC-SHA256 signature bound to post salt
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    salt as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    enc.encode(signingInput),
  );
  const signatureB64 = bytesToBase64Url(new Uint8Array(signature));

  return `${signingInput}.${signatureB64}`;
}

/**
 * Verify JWT signature, expiration, and slug, then decrypt content with token auth_key.
 * Throws if token is invalid, expired, or tampered.
 */
export async function decryptWithJwt(
  payload: EncryptedPayload,
  token: string,
  expectedSlug: string,
): Promise<string> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT token format");
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const salt = base64ToBytes(payload.salt);

  // Verify HMAC-SHA256 signature
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    salt as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const isValid = await crypto.subtle.verify(
    "HMAC",
    hmacKey,
    base64UrlToBytes(signatureB64) as BufferSource,
    enc.encode(`${headerB64}.${payloadB64}`),
  );

  if (!isValid) {
    throw new Error("JWT signature verification failed");
  }

  const parsedPayload: PostJwtPayload = JSON.parse(
    dec.decode(base64UrlToBytes(payloadB64)),
  );

  // Check slug binding
  if (parsedPayload.slug !== expectedSlug) {
    throw new Error("Token slug mismatch");
  }

  // Check expiration timestamp
  const now = Math.floor(Date.now() / 1000);
  if (parsedPayload.exp && parsedPayload.exp < now) {
    throw new Error("Token has expired");
  }

  // Import derived AES key from token
  const importedKey = await crypto.subtle.importKey(
    "raw",
    base64UrlToBytes(parsedPayload.auth_key) as BufferSource,
    "AES-GCM",
    false,
    ["decrypt"],
  );

  const iv = base64ToBytes(payload.iv);
  const ciphertext = base64ToBytes(payload.ciphertext);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    importedKey,
    ciphertext as BufferSource,
  );

  return dec.decode(decryptedBuffer);
}

/**
 * Helper to manage post-specific JWT cookies
 */
export const PostCookie = {
  getCookieName: (slug: string) =>
    `post_jwt_${slug.replace(/[^a-zA-Z0-9_-]/g, "_")}`,

  get: (slug: string): string | null => {
    if (typeof document === "undefined") return null;
    const name = PostCookie.getCookieName(slug);
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
      const [key, ...rest] = cookie.split("=");
      if (decodeURIComponent(key) === name) {
        return decodeURIComponent(rest.join("="));
      }
    }
    return null;
  },

  set: (slug: string, jwtToken: string, days: number = 7) => {
    if (typeof document === "undefined") return;
    const name = PostCookie.getCookieName(slug);
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(jwtToken)}; path=/; expires=${expires}; SameSite=Lax`;
  },

  remove: (slug: string) => {
    if (typeof document === "undefined") return;
    const name = PostCookie.getCookieName(slug);
    document.cookie = `${encodeURIComponent(name)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  },
};
