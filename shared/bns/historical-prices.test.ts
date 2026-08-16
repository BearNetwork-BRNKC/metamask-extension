import {
  historyPointsToPriceApiPrices,
  isBrnkcChartRequest,
  normalizeBrnkcHistoryPeriod,
  tryFetchBrnkcChartPrices,
} from './historical-prices';

describe('historical-prices (BRNKC chart adapter)', () => {
  it('detects native BRNKC via CAIP and via chain+address', () => {
    expect(
      isBrnkcChartRequest({
        assetId: 'eip155:641230/slip44:60',
      }),
    ).toBe(true);
    expect(
      isBrnkcChartRequest({
        assetId:
          'eip155:641230/erc20:0x0000000000000000000000000000000000000000',
      }),
    ).toBe(true);
    expect(
      isBrnkcChartRequest({
        chainId: '0x9c8ce',
        address: '0x0000000000000000000000000000000000000000',
      }),
    ).toBe(true);
    expect(
      isBrnkcChartRequest({
        assetId: 'eip155:1/slip44:60',
      }),
    ).toBe(false);
    expect(
      isBrnkcChartRequest({
        chainId: '0x1',
        address: '0x0000000000000000000000000000000000000000',
      }),
    ).toBe(false);
  });

  it('normalizes Price API periods including 1W', () => {
    expect(normalizeBrnkcHistoryPeriod('1D')).toBe('1D');
    expect(normalizeBrnkcHistoryPeriod('1w')).toBe('7D');
    expect(normalizeBrnkcHistoryPeriod('P1D')).toBeNull();
    expect(normalizeBrnkcHistoryPeriod('1000Y')).toBe('1000Y');
  });

  it('converts keeper seconds to chart milliseconds', () => {
    const prices = historyPointsToPriceApiPrices([
      { t: 1_786_513_278, p: 0.000325 },
      { t: 1_786_595_917, p: 0.00033 },
    ]);
    expect(prices).toEqual([
      [1_786_513_278_000, 0.000325],
      [1_786_595_917_000, 0.00033],
    ]);
  });

  it('leaves already-ms timestamps unchanged', () => {
    const prices = historyPointsToPriceApiPrices([
      { t: 1_786_513_278_000, p: 0.1 },
    ]);
    expect(prices[0][0]).toBe(1_786_513_278_000);
  });

  it('returns null for non-BRNKC so Codefi path stays intact', async () => {
    const fetchImpl = jest.fn();
    const result = await tryFetchBrnkcChartPrices({
      assetId: 'eip155:1/erc20:0x458036e7bc0612e9b207640dc07ca7711346aae5',
      timePeriod: '1D',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('maps keeper history to Price API chart prices', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        symbol: 'BRNKC',
        quote: 'USD',
        period: '1D',
        interval: '5m',
        points: [
          { t: 1000, p: 0.1 },
          { t: 1300, p: 0.2 },
        ],
      }),
    });

    const result = await tryFetchBrnkcChartPrices({
      assetId: 'eip155:641230/slip44:60',
      timePeriod: '1D',
      baseUrl: 'http://price.test',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result).toEqual({
      prices: [
        [1_000_000, 0.1],
        [1_300_000, 0.2],
      ],
    });
    expect(fetchImpl.mock.calls[0][0]).toBe(
      'http://price.test/v1/brnkc/history?period=1D',
    );
  });

  it('returns empty prices when keeper history is unavailable', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error('offline'));
    const result = await tryFetchBrnkcChartPrices({
      chainId: '0x9c8ce',
      address: '0x0000000000000000000000000000000000000000',
      timePeriod: '7D',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toEqual({ prices: [] });
  });
});
