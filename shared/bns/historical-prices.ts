/**
 * [BNES] Map keeper off-chain history onto MetaMask Price API chart shape.
 *
 * Official `useHistoricalPrices` only talks to price.api.cx.metamask.io;
 * BRNKC is not listed there. Keep conversion + fetch here so the upstream
 * hook only needs a small insertion.
 */

import { fetchBrnkcHistory } from './price-api-client';
import type { BrnkcHistoryPeriod } from './price-api-client';
import { isBrnkcNativeAssetId, isBrnkcNativeToken } from './verified-token';

/** MetaMask Price API chart payload: [timestampMs, price][]. */
export type PriceApiChartPrices = {
  prices: [number, number][];
};

const HISTORY_PERIODS = new Set<BrnkcHistoryPeriod>([
  '1D',
  '7D',
  '1M',
  '3M',
  '1Y',
  '1000Y',
]);

/**
 * Whether this asset page request is native BRNKC on BNES.
 *
 * @param args - CAIP-19 id and/or chain + address from the asset chart.
 */
export function isBrnkcChartRequest(args: {
  assetId?: string;
  chainId?: string;
  address?: string;
}): boolean {
  if (args.assetId && isBrnkcNativeAssetId(args.assetId)) {
    return true;
  }
  if (
    args.chainId &&
    isBrnkcNativeToken({
      symbol: 'BRNKC',
      chainId: args.chainId,
      address: args.address ?? '',
    })
  ) {
    return true;
  }
  return false;
}

/**
 * Normalize Price API / ISO-adjacent period strings to keeper periods.
 *
 * @param period - e.g. 1D, 7D, 1W, 1M, 3M, 1Y, 1000Y
 */
export function normalizeBrnkcHistoryPeriod(
  period: string,
): BrnkcHistoryPeriod | null {
  const p = period.trim().toUpperCase();
  if (p === '1W') {
    return '7D';
  }
  if (HISTORY_PERIODS.has(p as BrnkcHistoryPeriod)) {
    return p as BrnkcHistoryPeriod;
  }
  return null;
}

/**
 * Convert keeper `{ t, p }` points to Price API `[ms, price]` tuples.
 * Keeper `t` is unix seconds; the chart `x` axis is Date-compatible ms.
 *
 * @param points - Keeper history points.
 */
export function historyPointsToPriceApiPrices(
  points: Array<{ t: number; p: number }>,
): [number, number][] {
  const out: [number, number][] = [];
  for (const pt of points) {
    if (!Number.isFinite(pt.t) || !Number.isFinite(pt.p)) {
      continue;
    }
    const ms = pt.t > 0 && pt.t < 1e12 ? pt.t * 1000 : pt.t;
    out.push([ms, pt.p]);
  }
  return out;
}

/**
 * Fetch BRNKC chart prices, or null when the request is not native BRNKC
 * (caller should keep using Codefi).
 *
 * BRNKC + fetch/parse failure returns `{ prices: [] }` so the hook does not
 * fall through to Codefi (which has no BRNKC listing).
 *
 * @param options - Asset identity, period, and optional fetch injectors.
 */
export async function tryFetchBrnkcChartPrices(options: {
  assetId?: string;
  chainId?: string;
  address?: string;
  currency?: string;
  timePeriod: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}): Promise<PriceApiChartPrices | null> {
  if (
    !isBrnkcChartRequest({
      assetId: options.assetId,
      chainId: options.chainId,
      address: options.address,
    })
  ) {
    return null;
  }

  const period = normalizeBrnkcHistoryPeriod(options.timePeriod);
  if (!period) {
    return { prices: [] };
  }

  const hist = await fetchBrnkcHistory(period, {
    baseUrl: options.baseUrl,
    fetchImpl: options.fetchImpl,
    signal: options.signal,
  });
  if (!hist) {
    return { prices: [] };
  }
  return { prices: historyPointsToPriceApiPrices(hist.points) };
}
