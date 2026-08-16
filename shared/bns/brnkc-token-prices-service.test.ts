import {
  createBrnkcAwareTokenPricesService,
  priceWeiToUsdPerBrnkc,
  resolveBrnkcOraclePriceConfig,
  usdPerBrnkcToExchangeRateValue,
} from './brnkc-token-prices-service';
import type { TokenPricesServiceLike } from './brnkc-token-prices-service';
import { clearBrnkcPriceCache } from './price';
import {
  BNS_SEED_ORACLE_ADDRESS,
  BRNKC_NATIVE_ADDRESS,
} from './constants';
import { BEAR_NETWORK_CHAIN_ID } from '../constants/bearnetworkchain';

const ORACLE = '0xA3e9Dc4Fd7032Db1F4e8C8e776B3a7f23a65a85E';
/** $0.000325328 approx (18-dec) */
const SAMPLE_PRICE_WEI = 325327980985401n;

function makeInner(
  overrides: Partial<TokenPricesServiceLike> = {},
): TokenPricesServiceLike {
  return {
    fetchExchangeRates: jest.fn().mockResolvedValue({
      eth: {
        name: 'Ether',
        ticker: 'ETH',
        value: 0.0004,
        currencyType: 'crypto',
        usd: 0.0004,
      },
    }),
    fetchTokenPrices: jest.fn().mockResolvedValue([]),
    validateChainIdSupported: jest.fn((id: unknown) => id === '0x1'),
    validateCurrencySupported: jest.fn(() => true),
    ...overrides,
  };
}

describe('priceWeiToUsdPerBrnkc / exchange rate helpers', () => {
  it('converts 18-dec wei to USD per BRNKC', () => {
    const usd = priceWeiToUsdPerBrnkc(SAMPLE_PRICE_WEI);
    expect(usd).toBeCloseTo(0.000325327980985401, 15);
  });

  it('rejects non-positive price', () => {
    expect(priceWeiToUsdPerBrnkc(0n)).toBeNull();
  });

  it('inverts for Codefi exchange-rate value', () => {
    const usd = 0.000325328;
    const value = usdPerBrnkcToExchangeRateValue(usd);
    expect(1 / value).toBeCloseTo(usd, 12);
  });
});

describe('createBrnkcAwareTokenPricesService', () => {
  beforeEach(() => {
    clearBrnkcPriceCache();
  });

  it('injects BRNKC into fetchExchangeRates when base is USD', async () => {
    const inner = makeInner();
    const service = createBrnkcAwareTokenPricesService({
      inner,
      resolveOracleConfig: () => ({
        oracleAddress: ORACLE,
        rpcUrls: [
          'https://brnkc-mainnet.bearnetwork.net',
          'https://brnkc-mainnet1.bearnetwork.net',
          'https://bnes-mainnet.bearnetwork.net',
        ],
        timeoutMs: 10_000,
      }),
      fetchBrnkcUsdPrice: jest.fn().mockResolvedValue({
        priceWei: SAMPLE_PRICE_WEI,
        timestamp: 1_700_000_000,
        cacheAgeMs: 0,
      }),
    });

    const rates = await service.fetchExchangeRates({
      baseCurrency: 'usd',
      includeUsdRate: true,
      cryptocurrencies: ['ETH', 'BRNKC'],
    });

    expect(inner.fetchExchangeRates).toHaveBeenCalledWith({
      baseCurrency: 'usd',
      includeUsdRate: true,
      cryptocurrencies: ['ETH'],
    });
    expect(rates.eth).toBeDefined();
    expect(rates.brnkc).toBeDefined();
    expect(rates.brnkc.value).toBeCloseTo(1 / 0.000325327980985401, 6);
    expect(1 / rates.brnkc.value).toBeCloseTo(0.000325327980985401, 12);
  });

  it('does not inject BRNKC when base currency is not USD', async () => {
    const inner = makeInner({
      fetchExchangeRates: jest.fn().mockResolvedValue({
        eth: {
          name: 'Ether',
          ticker: 'ETH',
          value: 0.00035,
          currencyType: 'crypto',
        },
      }),
    });
    const fetchBrnkcUsdPrice = jest.fn();
    const service = createBrnkcAwareTokenPricesService({
      inner,
      resolveOracleConfig: () => ({
        oracleAddress: ORACLE,
        rpcUrls: ['https://a', 'https://b', 'https://c'],
        timeoutMs: 10_000,
      }),
      fetchBrnkcUsdPrice,
    });

    const rates = await service.fetchExchangeRates({
      baseCurrency: 'eur',
      includeUsdRate: true,
      cryptocurrencies: ['ETH', 'BRNKC'],
    });

    expect(fetchBrnkcUsdPrice).not.toHaveBeenCalled();
    expect(rates.brnkc).toBeUndefined();
    expect(rates.eth).toBeDefined();
  });

  it('returns BRNKC alone when only BRNKC is requested and Codefi has nothing', async () => {
    const inner = makeInner({
      fetchExchangeRates: jest.fn().mockRejectedValue(new Error('unsupported')),
    });
    const service = createBrnkcAwareTokenPricesService({
      inner,
      resolveOracleConfig: () => ({
        oracleAddress: ORACLE,
        rpcUrls: ['https://a', 'https://b', 'https://c'],
        timeoutMs: 10_000,
      }),
      fetchBrnkcUsdPrice: jest.fn().mockResolvedValue({
        priceWei: SAMPLE_PRICE_WEI,
        timestamp: 1,
        cacheAgeMs: 0,
      }),
    });

    const rates = await service.fetchExchangeRates({
      baseCurrency: 'usd',
      includeUsdRate: true,
      cryptocurrencies: ['BRNKC'],
    });

    expect(rates.brnkc).toBeDefined();
    expect(Object.keys(rates)).toStrictEqual(['brnkc']);
  });

  it('fail-closes BRNKC when oracle errors but still returns other rates', async () => {
    const inner = makeInner();
    const service = createBrnkcAwareTokenPricesService({
      inner,
      resolveOracleConfig: () => ({
        oracleAddress: ORACLE,
        rpcUrls: ['https://a', 'https://b', 'https://c'],
        timeoutMs: 10_000,
      }),
      fetchBrnkcUsdPrice: jest.fn().mockRejectedValue(new Error('stale')),
    });

    const rates = await service.fetchExchangeRates({
      baseCurrency: 'usd',
      includeUsdRate: true,
      cryptocurrencies: ['ETH', 'BRNKC'],
    });

    expect(rates.eth).toBeDefined();
    expect(rates.brnkc).toBeUndefined();
  });

  it('throws when nothing can be resolved', async () => {
    const inner = makeInner({
      fetchExchangeRates: jest.fn().mockRejectedValue(new Error('nope')),
    });
    const service = createBrnkcAwareTokenPricesService({
      inner,
      resolveOracleConfig: () => null,
      fetchBrnkcUsdPrice: jest.fn(),
    });

    await expect(
      service.fetchExchangeRates({
        baseCurrency: 'usd',
        includeUsdRate: true,
        cryptocurrencies: ['BRNKC'],
      }),
    ).rejects.toThrow();
  });

  it('fetchTokenPrices fills BNES native zero-address for USD', async () => {
    const inner = makeInner({
      fetchTokenPrices: jest.fn().mockResolvedValue([
        {
          tokenAddress: '0xabc' as `0x${string}`,
          chainId: '0x1' as `0x${string}`,
          currency: 'usd',
          price: 1,
        },
      ]),
    });
    const service = createBrnkcAwareTokenPricesService({
      inner,
      resolveOracleConfig: () => ({
        oracleAddress: ORACLE,
        rpcUrls: ['https://a', 'https://b', 'https://c'],
        timeoutMs: 10_000,
      }),
      fetchBrnkcUsdPrice: jest.fn().mockResolvedValue({
        priceWei: SAMPLE_PRICE_WEI,
        timestamp: 1,
        cacheAgeMs: 0,
      }),
      fetchSpot: jest.fn().mockResolvedValue(null),
    });

    const rows = await service.fetchTokenPrices({
      assets: [
        { chainId: '0x1' as `0x${string}`, tokenAddress: '0xabc' as `0x${string}` },
        {
          chainId: BEAR_NETWORK_CHAIN_ID,
          tokenAddress: BRNKC_NATIVE_ADDRESS as `0x${string}`,
        },
      ],
      currency: 'usd',
    });

    expect(inner.fetchTokenPrices).toHaveBeenCalledWith({
      assets: [
        { chainId: '0x1', tokenAddress: '0xabc' },
      ],
      currency: 'usd',
    });
    expect(rows).toHaveLength(2);
    const brnkc = rows.find(
      (r) => r.chainId.toLowerCase() === BEAR_NETWORK_CHAIN_ID.toLowerCase(),
    );
    expect(brnkc?.price).toBeCloseTo(0.000325327980985401, 12);
  });

  it('fetchTokenPrices uses keeper spot percentChange1d', async () => {
    const inner = makeInner({
      fetchTokenPrices: jest.fn().mockResolvedValue([]),
    });
    const service = createBrnkcAwareTokenPricesService({
      inner,
      fetchSpot: jest.fn().mockResolvedValue({
        symbol: 'BRNKC',
        quote: 'USD',
        price: 0.0003,
        priceWei: '300000000000000',
        timestamp: 1,
        percentChange: {
          '1h': 0.5,
          '1d': 2.37,
          '7d': -1,
          '14d': null,
          '30d': null,
          '90d': null,
          '200d': null,
          '1y': null,
          all: null,
        },
        allTimeHigh: 0.001,
        allTimeLow: 0.0001,
        sampleCountRaw: 100,
      }),
    });

    const rows = await service.fetchTokenPrices({
      assets: [
        {
          chainId: BEAR_NETWORK_CHAIN_ID,
          tokenAddress: BRNKC_NATIVE_ADDRESS as `0x${string}`,
        },
      ],
      currency: 'usd',
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].price).toBe(0.0003);
    expect(rows[0].pricePercentChange1d).toBe(2.37);
    expect(rows[0].pricePercentChange1h).toBe(0.5);
    expect(rows[0].allTimeHigh).toBe(0.001);
  });

  it('list percent falls back to 1h when 1d is null', async () => {
    const service = createBrnkcAwareTokenPricesService({
      inner: makeInner({ fetchTokenPrices: jest.fn().mockResolvedValue([]) }),
      fetchSpot: jest.fn().mockResolvedValue({
        symbol: 'BRNKC',
        quote: 'USD',
        price: 0.0003,
        priceWei: '300000000000000',
        timestamp: 1,
        percentChange: {
          '5m': 0.01,
          '1h': 1.5,
          '1d': null,
          '7d': null,
          '14d': null,
          '30d': null,
          '90d': null,
          '200d': null,
          '1y': null,
          all: 2,
        },
        allTimeHigh: 0.001,
        allTimeLow: 0.0001,
        sampleCountRaw: 20,
      }),
    });

    const rows = await service.fetchTokenPrices({
      assets: [
        {
          chainId: BEAR_NETWORK_CHAIN_ID,
          tokenAddress: BRNKC_NATIVE_ADDRESS as `0x${string}`,
        },
      ],
      currency: 'usd',
    });

    // UI only reads pricePercentChange1d — must not stay empty while 1h exists
    expect(rows[0].pricePercentChange1d).toBe(1.5);
  });

  it('marks BNES chain as supported', () => {
    const inner = makeInner();
    const service = createBrnkcAwareTokenPricesService({ inner });
    expect(service.validateChainIdSupported(BEAR_NETWORK_CHAIN_ID)).toBe(true);
    expect(service.validateChainIdSupported('0x1')).toBe(true);
    expect(service.validateChainIdSupported('0x999')).toBe(false);
  });
});

describe('resolveBrnkcOraclePriceConfig', () => {
  it('returns null or config depending on BNS_SEED_ORACLE_ADDRESS', () => {
    // Seed is build-time; we only assert shape / nullability without mutating env.
    const config = resolveBrnkcOraclePriceConfig();
    if (BNS_SEED_ORACLE_ADDRESS && BNS_SEED_ORACLE_ADDRESS.trim()) {
      expect(config?.oracleAddress).toBe(
        BNS_SEED_ORACLE_ADDRESS.trim().toLowerCase(),
      );
      expect(config?.rpcUrls.length).toBeGreaterThanOrEqual(2);
    } else {
      expect(config).toBeNull();
    }
  });
});
