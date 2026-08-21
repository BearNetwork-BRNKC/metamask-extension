/**
 * [BNES] Map keeper off-chain history onto MetaMask Price API chart shape.
 *
 * Official `useHistoricalPrices` only talks to price.api.cx.metamask.io;
 * BRNKC is not listed there. Keep conversion + fetch here so the upstream
 * hook only needs a small insertion.
 *
 * Bug fix (2026-08-17): 1D / 1Y / All 時段無法顯示的三個根因：
 *  1. normalizeBrnkcHistoryPeriod 未處理 ISO 8601 前綴（'P1D' → 無法映射）
 *  2. '1000Y' keeper 端使用 'ALL' 參數，須別名映射
 *  3. fetchBrnkcHistory 驗證過嚴：points 為 null 時應回傳 [] 而非 null
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
 * Accepts:
 * - Direct keeper strings: '1D', '7D', '1M', '3M', '1Y', '1000Y'
 * - ISO 8601 variants: 'P1D', 'P7D', 'P1W', 'P1M', 'P3M', 'P1Y', 'P1000Y'
 * - Week alias: '1W' / 'P1W' → '7D'
 * - All-time alias: 'ALL' / 'all' / '1000Y' / 'P1000Y' → '1000Y'
 *
 * @param period - e.g. 1D, P1D, 7D, 1W, P1W, 1M, 3M, 1Y, 1000Y, ALL
 */
export function normalizeBrnkcHistoryPeriod(
  period: string,
): BrnkcHistoryPeriod | null {
  // 去除 ISO 8601 前綴 'P'，統一成純數字+單位格式（如 'P1D' → '1D'）
  const raw = period.trim().toUpperCase();
  const p = raw.startsWith('P') ? raw.slice(1) : raw;

  // 1W / P1W → 7D（UI 按鈕使用 P1W 作為一週）
  if (p === '1W') {
    return '7D';
  }
  // ALL / all → 1000Y（Keeper 接受 '1000Y'，UI 可能傳入 'ALL' 或 'P1000Y'）
  if (p === 'ALL' || p === '1000Y') {
    return '1000Y';
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
