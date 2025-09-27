import { decryptValue, encryptValue, hashKey } from './utils.security.js';

const readLegacyValue = (key) => {
  const legacyValue = localStorage.getItem(key);
  if (!legacyValue) return undefined;
  try {
    return JSON.parse(legacyValue);
  } catch (error) {
    console.warn('Gagal mengurai data legacy dari storage', error);
    return undefined;
  }
};

export const readFromStorage = async (key, fallback) => {
  try {
    const secureKey = await hashKey(key);
    const storedValue = localStorage.getItem(secureKey);
    if (!storedValue) {
      const legacy = readLegacyValue(key);
      return legacy === undefined ? fallback : legacy;
    }
    const decrypted = await decryptValue(storedValue);
    if (!decrypted) return fallback;
    return JSON.parse(decrypted);
  } catch (error) {
    console.warn('Gagal membaca dari storage', error);
    return fallback;
  }
};

export const writeToStorage = async (key, value) => {
  try {
    const secureKey = await hashKey(key);
    const payload = await encryptValue(JSON.stringify(value));
    localStorage.setItem(secureKey, payload);
    if (secureKey !== key && localStorage.getItem(key)) {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn('Gagal menulis ke storage', error);
  }
};

export const removeFromStorage = async (key) => {
  try {
    const secureKey = await hashKey(key);
    localStorage.removeItem(secureKey);
    if (secureKey !== key) {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn('Gagal menghapus dari storage', error);
  }
};
