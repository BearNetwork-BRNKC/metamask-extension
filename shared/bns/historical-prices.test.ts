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

  // [BNES fix] 全面驗證時段正規化（含 ISO 前綴 + ALL 別名修復）
  it('normalizes direct keeper period strings', () => {
    expect(normalizeBrnkcHistoryPeriod('1D')).toBe('1D');
    expect(normalizeBrnkcHistoryPeriod('7D')).toBe('7D');
    expect(normalizeBrnkcHistoryPeriod('1M')).toBe('1M');
    expect(normalizeBrnkcHistoryPeriod('3M')).toBe('3M');
    expect(normalizeBrnkcHistoryPeriod('1Y')).toBe('1Y');
    expect(normalizeBrnkcHistoryPeriod('1000Y')).toBe('1000Y');
    expect(normalizeBrnkcHistoryPeriod('1w')).toBe('7D');
  });

  it('[BNES fix] normalizes ISO 8601 prefixed strings (fromIso8601DurationToPriceApiTimePeriod output)', () => {
    // 這些格式是 useHistoricalPrices 經 fromIso8601Duration... 轉換後的輸出
    // 修復前：P 前綴無法被識別 → 回傳 null → 1D/1Y/All 時段空圖表
    expect(normalizeBrnkcHistoryPeriod('P1D')).toBe('1D');   // 修復前回傳 null
    expect(normalizeBrnkcHistoryPeriod('P7D')).toBe('7D');
    expect(normalizeBrnkcHistoryPeriod('P1W')).toBe('7D');
    expect(normalizeBrnkcHistoryPeriod('P1M')).toBe('1M');
    expect(normalizeBrnkcHistoryPeriod('P3M')).toBe('3M');
    expect(normalizeBrnkcHistoryPeriod('P1Y')).toBe('1Y');   // 修復前回傳 null
    expect(normalizeBrnkcHistoryPeriod('P1000Y')).toBe('1000Y'); // 修復前回傳 null
  });

  it('[BNES fix] treats ALL as alias for 1000Y', () => {
    expect(normalizeBrnkcHistoryPeriod('ALL')).toBe('1000Y');
    expect(normalizeBrnkcHistoryPeriod('all')).toBe('1000Y');
  });

  it('returns null for invalid / unsupported periods', () => {
    expect(normalizeBrnkcHistoryPeriod('P1D2M')).toBeNull();
    expect(normalizeBrnkcHistoryPeriod('5H')).toBeNull();
    expect(normalizeBrnkcHistoryPeriod('')).toBeNull();
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

  // [BNES fix] 三個實際修復的 end-to-end 驗證
  it('[BNES fix] accepts ISO 8601 prefixed timePeriod (P1D was broken before)', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        symbol: 'BRNKC',
        quote: 'USD',
        period: '1D',
        interval: '5m',
        points: [{ t: 1000, p: 0.1 }],
      }),
    });

    const result = await tryFetchBrnkcChartPrices({
      assetId: 'eip155:641230/slip44:60',
      timePeriod: 'P1D', // ISO 前綴格式，修復前會 return { prices: [] }（因 normalizeBrnkcHistoryPeriod 回傳 null）
      baseUrl: 'http://price.test',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result).toEqual({ prices: [[1_000_000, 0.1]] });
    expect(fetchImpl.mock.calls[0][0]).toContain('period=1D');
  });

  it('[BNES fix] accepts P1000Y / ALL as all-time period', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        symbol: 'BRNKC',
        quote: 'USD',
        period: '1000Y',
        interval: '1d',
        points: [{ t: 2000, p: 0.0005 }],
      }),
    });

    const result = await tryFetchBrnkcChartPrices({
      assetId: 'eip155:641230/slip44:60',
      timePeriod: 'P1000Y', // 修復前：P 前綴導致 normalizeBrnkcHistoryPeriod → null → 空圖表
      baseUrl: 'http://price.test',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result).toEqual({ prices: [[2_000_000, 0.0005]] });
    expect(fetchImpl.mock.calls[0][0]).toContain('period=1000Y');
  });

  it('[BNES fix] returns empty prices (not null) when keeper returns points: null', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        symbol: 'BRNKC',
        quote: 'USD',
        period: '1D',
        interval: '5m',
        points: null, // keeper 可能在資料不足時回傳 null
      }),
    });

    const result = await tryFetchBrnkcChartPrices({
      assetId: 'eip155:641230/slip44:60',
      timePeriod: '1D',
      baseUrl: 'http://price.test',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    // 修復前：fetchBrnkcHistory 回傳 null → tryFetchBrnkcChartPrices 回傳 { prices: [] }
    // 修復後：仍回傳 { prices: [] }，但語意正確（資料不足，非請求失敗）
    expect(result).toEqual({ prices: [] });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
