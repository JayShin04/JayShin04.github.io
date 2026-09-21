export interface EncryptedPayload {
  salt: string;
  iv: string;
  ciphertext: string;
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
  const CHUNK_SIZE = 0x8000; // 32KB chunking to prevent stack overflow
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
 * Derive AES-256 key from password and salt using PBKDF2 (100,000 rounds of SHA-256)
 */
async function deriveKey(
  password: string,
  salt: Uint8Array,
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
    false,
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
  const key = await deriveKey(password, salt);

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

  const key = await deriveKey(password, salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

/**
 * Helper to manage post-specific password cookies
 */
export const PostCookie = {
  getCookieName: (slug: string) =>
    `post_auth_${slug.replace(/[^a-zA-Z0-9_-]/g, "_")}`,

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

  set: (slug: string, password: string, days: number = 7) => {
    if (typeof document === "undefined") return;
    const name = PostCookie.getCookieName(slug);
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(password)}; path=/; expires=${expires}; SameSite=Lax`;
  },

  remove: (slug: string) => {
    if (typeof document === "undefined") return;
    const name = PostCookie.getCookieName(slug);
    document.cookie = `${encodeURIComponent(name)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  },
};
