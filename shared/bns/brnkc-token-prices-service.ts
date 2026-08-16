/**
 * [BNES] Fork-only token prices service decorator.
 *
 * Wraps MetaMask's CodefiTokenPricesServiceV2 so BRNKC (native, chain 0x9c8ce)
 * is priced from BNESOracle instead of Codefi/CoinGecko (where BRNKC is not listed).
 *
 * All other currencies/chains pass through unchanged — upstream-safe insertion
 * for CurrencyRateController (and optionally TokenRatesController).
 *
 * Placement: logic lives here under shared/bns; upstream init only swaps
 * `tokenPricesService: createBrnkcAwareTokenPricesService(...)`.
 */

import { CodefiTokenPricesServiceV2 } from '@metamask/assets-controllers';
import type { Hex } from '@metamask/utils';

import {
  BEAR_NETWORK_CHAIN_CURRENCY_SYMBOL,
  BEAR_NETWORK_CHAIN_ID,
} from '../constants/bearnetworkchain';
import {
  BNS_DEFAULT_RPC_TIMEOUT_MS,
  BNS_READ_RPC_URLS,
  BNS_SEED_ORACLE_ADDRESS,
  BRNKC_NATIVE_ADDRESS,
} from './constants';
import { getBrnkcUsdPrice } from './price';
import type { BrnkcPriceResult } from './price';
import { fetchBrnkcSpot } from './price-api-client';
import type { BrnkcSpotResponse } from './price-api-client';
import type { BnsEthCall } from './resolve';

const BRNKC_SYMBOL = BEAR_NETWORK_CHAIN_CURRENCY_SYMBOL;
const BRNKC_SYMBOL_LC = BRNKC_SYMBOL.toLowerCase();
const BNES_CHAIN_ID = BEAR_NETWORK_CHAIN_ID.toLowerCase() as Hex;
const ZERO_ADDRESS = BRNKC_NATIVE_ADDRESS.toLowerCase();

/** Minimal config for oracle price reads (independent of BNS registry). */
export type BrnkcOraclePriceConfig = {
  oracleAddress: string;
  rpcUrls: readonly string[];
  timeoutMs: number;
};

/**
 * Subset of AbstractTokenPricesService used by CurrencyRateController.
 * Defined locally so we do not depend on non-exported package types.
 */
export type TokenPricesServiceLike = {
  fetchTokenPrices: (args: {
    assets: { tokenAddress: Hex; chainId: Hex }[];
    currency: string;
  }) => Promise<
    {
      tokenAddress: Hex;
      chainId: Hex;
      currency: string;
      price: number;
      [key: string]: unknown;
    }[]
  >;
  fetchExchangeRates: (args: {
    baseCurrency: string;
    includeUsdRate: boolean;
    cryptocurrencies: string[];
  }) => Promise<Record<string, ExchangeRateLike>>;
  validateChainIdSupported: (chainId: unknown) => boolean;
  validateCurrencySupported: (currency: unknown) => boolean;
  setNativeAssetIdentifiers?: (nativeAssetIdentifiers: unknown) => void;
  onBreak?: (handler: (...args: unknown[]) => void) => void;
  onDegraded?: (handler: (...args: unknown[]) => void) => void;
};

export type ExchangeRateLike = {
  name: string;
  ticker: string;
  value: number;
  currencyType: string;
  usd?: number;
};

export type CreateBrnkcAwareTokenPricesServiceOptions = {
  /**
   * Underlying Codefi (or mock) service. Defaults to CodefiTokenPricesServiceV2.
   */
  inner?: TokenPricesServiceLike;
  /**
   * Oracle + RPC config. Defaults to build-time seed + BNS read RPCs.
   * Return null to disable oracle path (fail closed).
   */
  resolveOracleConfig?: () => BrnkcOraclePriceConfig | null;
  /**
   * Injected price fetcher (tests). Defaults to getBrnkcUsdPrice.
   */
  fetchBrnkcUsdPrice?: (
    config: BrnkcOraclePriceConfig,
    ethCall?: BnsEthCall,
  ) => Promise<BrnkcPriceResult>;
  /**
   * Optional eth_call injection for tests.
   */
  ethCall?: BnsEthCall;
  /**
   * Keeper history spot API (percent changes + ATH/ATL). Defaults to fetchBrnkcSpot.
   */
  fetchSpot?: () => Promise<BrnkcSpotResponse | null>;
};

/**
 * Resolve oracle config from build env seed. Independent of BNS registry.
 *
 * @returns Config or null when oracle address is unset / zero.
 */
export function resolveBrnkcOraclePriceConfig(): BrnkcOraclePriceConfig | null {
  const raw = (BNS_SEED_ORACLE_ADDRESS || '').trim();
  if (!raw) {
    return null;
  }
  if (!/^0x[0-9a-fA-F]{40}$/u.test(raw)) {
    return null;
  }
  if (raw.toLowerCase() === ZERO_ADDRESS) {
    return null;
  }
  return {
    oracleAddress: raw.toLowerCase(),
    rpcUrls: BNS_READ_RPC_URLS,
    timeoutMs: BNS_DEFAULT_RPC_TIMEOUT_MS,
  };
}

/**
 * Convert 18-dec USD-per-BRNKC wei into a JS number (USD per 1 BRNKC).
 *
 * @param priceWei - Oracle price (18 decimals).
 * @returns USD per BRNKC, or null if non-positive / non-finite.
 */
export function priceWeiToUsdPerBrnkc(priceWei: bigint): number | null {
  if (priceWei <= 0n) {
    return null;
  }
  // priceWei is ~1e14–1e15 for sub-cent tokens; safe in Number range.
  const usd = Number(priceWei) / 1e18;
  if (!Number.isFinite(usd) || usd <= 0) {
    return null;
  }
  return usd;
}

/**
 * Codefi exchange-rate `value` is "crypto units per 1 unit of base currency".
 * CurrencyRateController stores conversionRate = 1 / value (fiat per crypto).
 *
 * @param usdPerBrnkc - USD (or fiat) per 1 BRNKC.
 * @returns BRNKC per 1 USD.
 */
export function usdPerBrnkcToExchangeRateValue(usdPerBrnkc: number): number {
  return 1 / usdPerBrnkc;
}

function isBrnkcSymbol(symbol: string): boolean {
  return symbol.toUpperCase() === BRNKC_SYMBOL;
}

function isBnesChainId(chainId: unknown): boolean {
  return (
    typeof chainId === 'string' && chainId.toLowerCase() === BNES_CHAIN_ID
  );
}

function isNativeZeroAddress(tokenAddress: string): boolean {
  return tokenAddress.toLowerCase() === ZERO_ADDRESS;
}

/**
 * Pick a number for UI list % (field is always pricePercentChange1d).
 * Prefer true 1d; while history is filling, fall back to 1h → 5m → all
 * so the row is not stuck on "-" after only a few keeper samples.
 */
function listPercentChange(
  pc: BrnkcSpotResponse['percentChange'] | undefined,
): number | null {
  if (!pc) {
    return null;
  }
  const order = ['1d', '1h', '5m', 'all'] as const;
  for (const key of order) {
    const v = pc[key as keyof typeof pc];
    if (typeof v === 'number' && Number.isFinite(v)) {
      return v;
    }
  }
  return null;
}

/** Finite % for UI; null/undefined → NaN → PercentageChange shows "-". */
function pctOrNaN(v: number | null | undefined): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : Number.NaN;
}

function marketFieldsFromSpot(price: number, spot: BrnkcSpotResponse | null) {
  const pc = spot?.percentChange;
  const listPct = listPercentChange(pc);
  const ath =
    typeof spot?.allTimeHigh === 'number' && spot.allTimeHigh > 0
      ? spot.allTimeHigh
      : price;
  const atl =
    typeof spot?.allTimeLow === 'number' && spot.allTimeLow > 0
      ? spot.allTimeLow
      : price;
  return {
    allTimeHigh: ath,
    allTimeLow: atl,
    circulatingSupply: 0,
    dilutedMarketCap: 0,
    high1d: 0,
    low1d: 0,
    marketCap: 0,
    marketCapPercentChange1d: pctOrNaN(listPct),
    price,
    priceChange1d: 0,
    // Home list hardcodes this field (MetaMask 24h slot); progressive fill above
    pricePercentChange1d: pctOrNaN(listPct),
    pricePercentChange1h: pctOrNaN(pc?.['1h']),
    pricePercentChange1y: pctOrNaN(pc?.['1y']),
    pricePercentChange7d: pctOrNaN(pc?.['7d']),
    pricePercentChange14d: pctOrNaN(pc?.['14d']),
    pricePercentChange30d: pctOrNaN(pc?.['30d']),
    pricePercentChange200d: pctOrNaN(pc?.['200d']),
    totalVolume: 0,
  };
}

/**
 * Create a Codefi-compatible token prices service that fills BRNKC from BNESOracle.
 *
 * @param options - Optional inner service and test injectors.
 * @returns Token prices service for CurrencyRateController.
 */
export function createBrnkcAwareTokenPricesService(
  options: CreateBrnkcAwareTokenPricesServiceOptions = {},
): TokenPricesServiceLike {
  const inner: TokenPricesServiceLike =
    options.inner ??
    (new CodefiTokenPricesServiceV2() as unknown as TokenPricesServiceLike);
  const resolveOracleConfig =
    options.resolveOracleConfig ?? resolveBrnkcOraclePriceConfig;
  const fetchPrice = options.fetchBrnkcUsdPrice ?? defaultFetchBrnkcUsdPrice;
  const fetchSpot = options.fetchSpot ?? (() => fetchBrnkcSpot());
  const ethCall = options.ethCall;

  async function tryGetUsdPerBrnkc(): Promise<number | null> {
    // Prefer keeper spot API (includes history); fall back to on-chain oracle.
    try {
      const spot = await fetchSpot();
      if (spot && typeof spot.price === 'number' && spot.price > 0) {
        return spot.price;
      }
    } catch {
      /* fall through to eth_call */
    }
    const config = resolveOracleConfig();
    if (!config) {
      return null;
    }
    try {
      const result = await fetchPrice(config, ethCall);
      return priceWeiToUsdPerBrnkc(result.priceWei);
    } catch {
      // Fail closed for BRNKC only; never break other currencies.
      return null;
    }
  }

  async function tryGetSpot(): Promise<BrnkcSpotResponse | null> {
    try {
      return await fetchSpot();
    } catch {
      return null;
    }
  }

  const service: TokenPricesServiceLike = {
    async fetchExchangeRates({
      baseCurrency,
      includeUsdRate,
      cryptocurrencies,
    }) {
      const wantsBrnkc = cryptocurrencies.some(isBrnkcSymbol);
      const others = cryptocurrencies.filter((c) => !isBrnkcSymbol(c));

      let rates: Record<string, ExchangeRateLike> = {};
      let othersError: unknown;

      if (others.length > 0) {
        try {
          rates = await inner.fetchExchangeRates({
            baseCurrency,
            includeUsdRate,
            cryptocurrencies: others,
          });
        } catch (error) {
          othersError = error;
        }
      }

      // Oracle reports USD per BRNKC only; inject when base is USD.
      if (wantsBrnkc && baseCurrency.toLowerCase() === 'usd') {
        const usdPerBrnkc = await tryGetUsdPerBrnkc();
        if (usdPerBrnkc !== null) {
          const value = usdPerBrnkcToExchangeRateValue(usdPerBrnkc);
          rates[BRNKC_SYMBOL_LC] = {
            name: BRNKC_SYMBOL,
            ticker: BRNKC_SYMBOL,
            value,
            currencyType: 'crypto',
            usd: value,
          };
        }
      }

      if (Object.keys(rates).length === 0) {
        if (othersError) {
          throw othersError;
        }
        throw new Error(
          'None of the cryptocurrencies are supported by price api',
        );
      }

      return rates;
    },

    async fetchTokenPrices({ assets, currency }) {
      const bnesNativeAssets = assets.filter(
        (a) =>
          isBnesChainId(a.chainId) && isNativeZeroAddress(a.tokenAddress),
      );
      const passThroughAssets = assets.filter(
        (a) =>
          !(isBnesChainId(a.chainId) && isNativeZeroAddress(a.tokenAddress)),
      );

      let passThrough: Awaited<
        ReturnType<TokenPricesServiceLike['fetchTokenPrices']>
      > = [];
      if (passThroughAssets.length > 0) {
        try {
          passThrough = await inner.fetchTokenPrices({
            assets: passThroughAssets,
            currency,
          });
        } catch {
          passThrough = [];
        }
      }

      const oracleRows: Awaited<
        ReturnType<TokenPricesServiceLike['fetchTokenPrices']>
      > = [];

      // Spot path: conversionRate uses price; list % uses pricePercentChange1d.
      if (
        bnesNativeAssets.length > 0 &&
        currency.toLowerCase() === 'usd'
      ) {
        const spot = await tryGetSpot();
        const usdPerBrnkc =
          spot && spot.price > 0 ? spot.price : await tryGetUsdPerBrnkc();
        if (usdPerBrnkc !== null) {
          const fields = marketFieldsFromSpot(usdPerBrnkc, spot);
          for (const asset of bnesNativeAssets) {
            oracleRows.push({
              tokenAddress: asset.tokenAddress,
              chainId: asset.chainId,
              currency,
              ...fields,
            });
          }
        }
      }

      return [...passThrough, ...oracleRows];
    },

    validateChainIdSupported(chainId: unknown): boolean {
      if (isBnesChainId(chainId)) {
        return true;
      }
      return inner.validateChainIdSupported(chainId);
    },

    validateCurrencySupported(currency: unknown): boolean {
      return inner.validateCurrencySupported(currency);
    },
  };

  if (typeof inner.setNativeAssetIdentifiers === 'function') {
    service.setNativeAssetIdentifiers = (nativeAssetIdentifiers) => {
      inner.setNativeAssetIdentifiers?.(nativeAssetIdentifiers);
    };
  }
  if (typeof inner.onBreak === 'function') {
    service.onBreak = (handler) => {
      inner.onBreak?.(handler);
    };
  }
  if (typeof inner.onDegraded === 'function') {
    service.onDegraded = (handler) => {
      inner.onDegraded?.(handler);
    };
  }

  return service;
}

async function defaultFetchBrnkcUsdPrice(
  config: BrnkcOraclePriceConfig,
  ethCall?: BnsEthCall,
): Promise<BrnkcPriceResult> {
  // getBrnkcUsdPrice only requires oracleAddress (+ rpc via default ethCall).
  // Registry/gateway are unused for price reads; supply placeholders for type.
  return getBrnkcUsdPrice(
    {
      registryAddress: '0x0000000000000000000000000000000000000001',
      gatewayHost: 'ipfs.bearnetwork.net',
      rpcUrls: config.rpcUrls,
      timeoutMs: config.timeoutMs,
      oracleAddress: config.oracleAddress,
    },
    ethCall,
  );
}
