const encoder = new TextEncoder();
const decoder = new TextDecoder();

const STORAGE_SALT = 'newsapp::secure::preferences';
const KEY_SALT = 'newsapp::secure::key';
const PBKDF2_ITERATIONS = 120000;

const bufferToHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const encodeBase64String = (value) => bufferToBase64(encoder.encode(value).buffer);
const decodeBase64String = (value) => decoder.decode(base64ToBuffer(value));

const base64ToBuffer = (value) => {
  const binary = atob(value);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
};

export const isSecureStorageSupported = () =>
  typeof window !== 'undefined' && Boolean(window.isSecureContext) && Boolean(window.crypto?.subtle);

const getKeyMaterial = async () => {
  if (!isSecureStorageSupported()) return null;
  const secretSeed = `${window.location.origin}::${navigator.userAgent}::${STORAGE_SALT}`;
  return window.crypto.subtle.importKey('raw', encoder.encode(secretSeed), 'PBKDF2', false, ['deriveKey']);
};

const deriveAesKey = async () => {
  if (!isSecureStorageSupported()) return null;
  const material = await getKeyMaterial();
  if (!material) return null;
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(KEY_SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
};

export const hashKey = async (key) => {
  if (!isSecureStorageSupported()) return key;
  const digest = await window.crypto.subtle.digest('SHA-256', encoder.encode(`${key}::${KEY_SALT}`));
  return bufferToHex(digest);
};

export const encryptValue = async (value) => {
  try {
    const key = await deriveAesKey();
    if (!key) {
      return encodeBase64String(value);
    }
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(value));
    return `${bufferToBase64(iv.buffer)}.${bufferToBase64(encrypted)}`;
  } catch (error) {
    console.warn('Gagal mengenkripsi data, fallback ke encoding dasar', error);
    try {
      return encodeBase64String(value);
    } catch (fallbackError) {
      console.warn('Fallback encoding gagal', fallbackError);
      return value;
    }
  }
};

export const decryptValue = async (payload) => {
  if (!payload) return null;
  try {
    const key = await deriveAesKey();
    if (!key) {
      return decodeBase64String(payload);
    }
    const [rawIv, rawCipher] = payload.split('.');
    if (!rawIv || !rawCipher) return null;
    const iv = new Uint8Array(base64ToBuffer(rawIv));
    const ciphertext = base64ToBuffer(rawCipher);
    const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return decoder.decode(decrypted);
  } catch (error) {
    try {
      return decodeBase64String(payload);
    } catch (fallbackError) {
      console.warn('Gagal mendekripsi data terenkripsi', error, fallbackError);
      return null;
    }
  }
};

export const generateIntegrityHash = async (input) => {
  const normalized =
    typeof input === 'string'
      ? input
      : JSON.stringify(input, Object.keys(input || {}).sort());
  try {
    if (isSecureStorageSupported()) {
      const digest = await window.crypto.subtle.digest('SHA-256', encoder.encode(`${normalized}::${STORAGE_SALT}`));
      return bufferToHex(digest).toUpperCase();
    }
  } catch (error) {
    console.warn('Gagal menghasilkan hash SHA-256, gunakan fallback', error);
  }
  try {
    return encodeBase64String(normalized).toUpperCase();
  } catch {
    return `${normalized}`.toUpperCase();
  }
};

export const maskFingerprint = (fingerprint) => {
  if (!fingerprint) return 'Belum tersedia';
  if (fingerprint.length <= 12) return fingerprint;
  const start = fingerprint.slice(0, 8);
  const end = fingerprint.slice(-8);
  return `${start} ••• ${end}`;
};

