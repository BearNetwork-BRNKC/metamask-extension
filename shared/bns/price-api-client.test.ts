import {
  clearBrnkcSpotCache,
  fetchBrnkcHistory,
  fetchBrnkcSpot,
} from './price-api-client';

describe('price-api-client', () => {
  beforeEach(() => {
    clearBrnkcSpotCache();
  });

  it('fetches and caches spot', async () => {
    const body = {
      symbol: 'BRNKC',
      quote: 'USD',
      price: 0.0003,
      priceWei: '300000000000000',
      timestamp: 100,
      percentChange: {
        '1h': 0.1,
        '1d': 2.37,
        '7d': null,
        '14d': null,
        '30d': null,
        '90d': null,
        '200d': null,
        '1y': null,
        all: null,
      },
      allTimeHigh: 0.001,
      allTimeLow: 0.0001,
      sampleCountRaw: 10,
    };
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => body,
    });

    const first = await fetchBrnkcSpot({
      baseUrl: 'http://price.test',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const second = await fetchBrnkcSpot({
      baseUrl: 'http://price.test',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(first?.percentChange['1d']).toBe(2.37);
    expect(second?.price).toBe(0.0003);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe('http://price.test/v1/brnkc/spot');
  });

  it('returns null on network failure', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error('offline'));
    const spot = await fetchBrnkcSpot({
      baseUrl: 'http://price.test',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(spot).toBeNull();
  });

  it('fetches history points', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        symbol: 'BRNKC',
        quote: 'USD',
        period: '1D',
        interval: '5m',
        points: [{ t: 1, p: 0.1 }],
      }),
    });
    const hist = await fetchBrnkcHistory('1D', {
      baseUrl: 'http://price.test',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(hist?.points).toHaveLength(1);
  });
});
