/**
 * [BNES] Client for Oracle Keeper off-chain price history HTTP API.
 *
 * Endpoints (see BNESOracle scripts/price-history-api.ts):
 *   GET /v1/brnkc/spot
 *   GET /v1/brnkc/history?period=1D|7D|1M|3M|1Y|1000Y
 */

import { BNS_ORACLE_PRICE_CACHE_TTL_MS, BNS_PRICE_API_URL } from './constants';

export type BrnkcSpotPercentChange = {
  '5m'?: number | null;
  '1h': number | null;
  '1d': number | null;
  '7d': number | null;
  '14d': number | null;
  '30d': number | null;
  '90d': number | null;
  '200d': number | null;
  '1y': number | null;
  all: number | null;
};

export type BrnkcSpotResponse = {
  symbol: 'BRNKC';
  quote: 'USD';
  price: number;
  priceWei: string;
  timestamp: number;
  percentChange: BrnkcSpotPercentChange;
  allTimeHigh: number | null;
  allTimeLow: number | null;
  sampleCountRaw: number;
};

export type BrnkcHistoryPeriod = '1D' | '7D' | '1M' | '3M' | '1Y' | '1000Y';

export type BrnkcHistoryResponse = {
  symbol: 'BRNKC';
  quote: 'USD';
  period: BrnkcHistoryPeriod;
  interval: '5m' | '1h' | '1d';
  points: Array<{ t: number; p: number }>;
};

type CacheEntry = {
  fetchedAt: number;
  data: BrnkcSpotResponse;
};

let spotCache: CacheEntry | null = null;

export function clearBrnkcSpotCache(): void {
  spotCache = null;
}

function resolveBaseUrl(baseUrl?: string): string {
  const raw = (baseUrl ?? BNS_PRICE_API_URL).trim().replace(/\/+$/u, '');
  return raw;
}

/**
 * Fetch BRNKC spot + multi-window percent changes from the keeper price API.
 *
 * @param options - Optional base URL / fetch injectors for tests.
 * @returns Spot payload or null on network / parse failure (fail closed).
 */
export async function fetchBrnkcSpot(options?: {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  cacheTtlMs?: number;
}): Promise<BrnkcSpotResponse | null> {
  const ttl = options?.cacheTtlMs ?? BNS_ORACLE_PRICE_CACHE_TTL_MS;
  const now = Date.now();
  if (spotCache && now - spotCache.fetchedAt < ttl) {
    return spotCache.data;
  }

  const base = resolveBaseUrl(options?.baseUrl);
  if (!base) {
    return null;
  }

  const fetchFn = options?.fetchImpl ?? globalThis.fetch;
  if (typeof fetchFn !== 'function') {
    return null;
  }

  try {
    const res = await fetchFn(`${base}/v1/brnkc/spot`, {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as BrnkcSpotResponse;
    if (
      typeof data?.price !== 'number' ||
      !data.percentChange ||
      typeof data.priceWei !== 'string'
    ) {
      return null;
    }
    spotCache = { fetchedAt: now, data };
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetch historical chart points for a MetaMask Price API-style period.
 *
 * @param period - 1D | 7D | 1M | 3M | 1Y | 1000Y
 * @param options - Optional base URL / fetch.
 */
export async function fetchBrnkcHistory(
  period: BrnkcHistoryPeriod,
  options?: {
    baseUrl?: string;
    fetchImpl?: typeof fetch;
    signal?: AbortSignal;
  },
): Promise<BrnkcHistoryResponse | null> {
  const base = resolveBaseUrl(options?.baseUrl);
  if (!base) {
    return null;
  }
  const fetchFn = options?.fetchImpl ?? globalThis.fetch;
  if (typeof fetchFn !== 'function') {
    return null;
  }
  try {
    const url = `${base}/v1/brnkc/history?period=${encodeURIComponent(period)}`;
    const res = await fetchFn(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: options?.signal,
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as BrnkcHistoryResponse;
    if (!Array.isArray(data?.points)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
