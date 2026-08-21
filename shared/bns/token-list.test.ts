import {
  isBnesChainId,
  getBnesStaticTokenList,
  clearBnesStaticTokenListCache,
} from './token-list';

describe('token-list', () => {
  beforeEach(() => {
    clearBnesStaticTokenListCache();
    jest.resetModules();
  });

  describe('isBnesChainId', () => {
    it('returns true for BNES mainnet chain ID', () => {
      expect(isBnesChainId('0x9c8ce')).toBe(true);
      expect(isBnesChainId('0x9C8CE')).toBe(true);
    });

    it('returns false for other chain IDs', () => {
      expect(isBnesChainId('0x1')).toBe(false);
      expect(isBnesChainId('0x2')).toBe(false);
    });
  });

  describe('getBnesStaticTokenList', () => {
    it('loads and parses the token list from the NPM package', () => {
      const mockTokenList = {
        name: 'BearNetworkChain Token List',
        timestamp: '2026-08-17T00:00:00Z',
        version: { major: 1, minor: 0, patch: 0 },
        tokens: [
          {
            chainId: 641230,
            address: '0x1234567890123456789012345678901234567890',
            name: 'Test Token 1',
            symbol: 'TT1',
            decimals: 18,
          },
          {
            chainId: 641230,
            address: '0x0987654321098765432109876543210987654321',
            name: 'Test Token 2',
            symbol: 'TT2',
            decimals: 6,
          },
        ],
      };

      jest.mock('@bearnetwork/bnes-token-list/build/bnes-token-list.json', () => mockTokenList, {
        virtual: true,
      });

      const map = getBnesStaticTokenList();

      expect(Object.keys(map)).toHaveLength(2);
      expect(map['0x1234567890123456789012345678901234567890']).toEqual(mockTokenList.tokens[0]);
      expect(map['0x0987654321098765432109876543210987654321']).toEqual(mockTokenList.tokens[1]);
    });

    it('returns an empty object and logs warning if package is missing or fails to load', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      
      // Mock requiring a module that does not exist
      jest.mock('@bearnetwork/bnes-token-list/build/bnes-token-list.json', () => {
        throw new Error('Cannot find module');
      }, { virtual: true });

      const map = getBnesStaticTokenList();

      expect(map).toEqual({});
      expect(warnSpy).toHaveBeenCalledWith(
        '[BNES] Failed to load @bearnetwork/bnes-token-list. Ensure it is installed.',
        expect.any(Error)
      );

      warnSpy.mockRestore();
    });

    it('returns from cache on subsequent calls', () => {
      const mockTokenList = {
        tokens: [
          {
            chainId: 641230,
            address: '0x1111111111111111111111111111111111111111',
            name: 'Test Token',
            symbol: 'TT',
            decimals: 18,
          },
        ],
      };

      jest.mock('@bearnetwork/bnes-token-list/build/bnes-token-list.json', () => mockTokenList, {
        virtual: true,
      });

      const map1 = getBnesStaticTokenList();
      const map2 = getBnesStaticTokenList();

      expect(map1).toBe(map2); // referential equality checks cache
    });
  });
});
