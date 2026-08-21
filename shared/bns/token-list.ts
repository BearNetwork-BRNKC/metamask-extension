/**
 * [BNES] Token List Manager
 *
 * Provides a localized cache and lookup mechanism for the BNES Token List.
 * The token list is imported from the official NPM package published by
 * the BNES Token List repository (@bearnetwork/bnes-token-list).
 */

import type { Hex } from '@metamask/utils';

export type BnesTokenInfo = {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};

export type BnesTokenList = {
  name: string;
  timestamp: string;
  version: { major: number; minor: number; patch: number };
  tokens: BnesTokenInfo[];
};

let cachedTokenMap: Record<string, BnesTokenInfo> | null = null;

/**
 * Checks if the given chain ID belongs to the BearNetworkChain mainnet.
 */
export function isBnesChainId(chainId: string | Hex): boolean {
  // BNES Mainnet Chain ID: 641230 -> 0x9c8ce
  return typeof chainId === 'string' && chainId.toLowerCase() === '0x9c8ce';
}

/**
 * Returns a map of standardAddress (lowercase hex) -> BnesTokenInfo.
 * Builds the cache lazily on the first call to avoid unnecessary work during startup.
 */
export function getBnesStaticTokenList(): Record<string, BnesTokenInfo> {
  if (cachedTokenMap) {
    return cachedTokenMap;
  }

  const map: Record<string, BnesTokenInfo> = {};

  try {
    // 透過 NPM 相依載入發幣商維護的清單
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rawList = require('@bearnetwork/bnes-token-list/build/bnes-token-list.json') as BnesTokenList;

    if (Array.isArray(rawList?.tokens)) {
      for (const token of rawList.tokens) {
        if (token.address && typeof token.address === 'string') {
          map[token.address.toLowerCase()] = token;
        }
      }
    }
  } catch (error) {
    // 若尚未 npm install 或清單套件不可用，靜默忽略或記錄警告
    console.warn(
      '[BNES] Failed to load @bearnetwork/bnes-token-list. Ensure it is installed.',
      error,
    );
  }

  cachedTokenMap = map;
  return map;
}

/**
 * Clears the cached token list map. (Mainly for testing)
 */
export function clearBnesStaticTokenListCache() {
  cachedTokenMap = null;
}
