import { PROTOCOL_VERSION } from '@/types/constants';

const PREFIX = `soyjere_v${PROTOCOL_VERSION}_`;

export function storageKey(key: string) {
  return `${PREFIX}${key}`;
}

export function purgeLegacyKeys() {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('soyjere_') && !key.startsWith(PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}
