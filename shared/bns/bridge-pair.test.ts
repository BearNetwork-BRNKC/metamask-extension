import {
  getBnesOfficialBridgeDefaultToAsset,
  isBnesBscBrnkcBridgePair,
  normalizeBnesBridgeChain,
} from './bridge-pair';
import { BNS_BSC_BRNKC_TOKEN } from './constants';

describe('bnes BRNKC-only bridge pair', () => {
  it('normalizes BSC and BearNetworkChain ids', () => {
    expect(normalizeBnesBridgeChain('0x38')).toBe('bsc');
    expect(normalizeBnesBridgeChain('eip155:56')).toBe('bsc');
    expect(normalizeBnesBridgeChain('0x9c8ce')).toBe('bearnetworkchain');
    expect(normalizeBnesBridgeChain('bearnet')).toBe('bearnetworkchain');
    expect(normalizeBnesBridgeChain('0x1')).toBeNull();
  });

  it('allows BSC BRNKC ERC-20 ↔ BNES native BRNKC', () => {
    expect(
      isBnesBscBrnkcBridgePair(
        {
          chainId: '0x38',
          symbol: 'BRNKC',
          address: BNS_BSC_BRNKC_TOKEN,
        },
        { chainId: '0x9c8ce', symbol: 'BRNKC', isNative: true },
      ),
    ).toBe(true);
    expect(
      isBnesBscBrnkcBridgePair(
        { chainId: '641230', symbol: 'BRNKC', isNative: true },
        {
          chainId: '56',
          symbol: 'BRNKC',
          address: BNS_BSC_BRNKC_TOKEN,
        },
      ),
    ).toBe(true);
  });

  it('defaults dest to opposite-chain BRNKC', () => {
    const dest = getBnesOfficialBridgeDefaultToAsset({
      chainId: '0x38',
      symbol: 'BRNKC',
      address: BNS_BSC_BRNKC_TOKEN,
    });
    expect(dest?.assetId).toContain('eip155:641230');
    expect(
      getBnesOfficialBridgeDefaultToAsset({
        chainId: '0x9c8ce',
        symbol: 'BRNKC',
        isNative: true,
      })?.assetId,
    ).toContain('eip155:56/erc20:');
  });

  it('rejects USDT, native BNB, same-chain, and other networks', () => {
    expect(
      isBnesBscBrnkcBridgePair(
        { chainId: '0x38', symbol: 'USDT' },
        { chainId: '0x9c8ce', symbol: 'BRNKC', isNative: true },
      ),
    ).toBe(false);
    expect(
      isBnesBscBrnkcBridgePair(
        { chainId: '0x38', symbol: 'BNB', isNative: true },
        { chainId: '0x9c8ce', symbol: 'BRNKC', isNative: true },
      ),
    ).toBe(false);
    expect(
      isBnesBscBrnkcBridgePair(
        { chainId: '0x9c8ce', symbol: 'BRNKC', isNative: true },
        { chainId: '0x9c8ce', symbol: 'BRNKC', isNative: true },
      ),
    ).toBe(false);
    expect(
      isBnesBscBrnkcBridgePair(
        { chainId: '0x1', symbol: 'BRNKC' },
        { chainId: '0x9c8ce', symbol: 'BRNKC', isNative: true },
      ),
    ).toBe(false);
  });
});
