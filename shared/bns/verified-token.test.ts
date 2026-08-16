import {
  getBrnkcVerifiedSecurityData,
  isBrnkcNativeAssetId,
  isBrnkcNativeToken,
  resolveBrnkcSecurityData,
} from './verified-token';

describe('verified-token', () => {
  it('detects BNES native CAIP forms', () => {
    expect(
      isBrnkcNativeAssetId(
        'eip155:641230/erc20:0x0000000000000000000000000000000000000000',
      ),
    ).toBe(true);
    expect(isBrnkcNativeAssetId('eip155:641230/slip44:60')).toBe(true);
    expect(
      isBrnkcNativeAssetId(
        'eip155:1/erc20:0x0000000000000000000000000000000000000000',
      ),
    ).toBe(false);
  });

  it('detects token metadata for native BRNKC', () => {
    expect(
      isBrnkcNativeToken({
        symbol: 'BRNKC',
        chainId: '0x9c8ce',
        isNative: true,
      }),
    ).toBe(true);
    expect(
      isBrnkcNativeToken({
        symbol: 'BNB',
        chainId: '0x38',
        isNative: true,
      }),
    ).toBe(false);
  });

  it('injects Verified when API has no data', () => {
    const data = resolveBrnkcSecurityData(
      'eip155:641230/erc20:0x0000000000000000000000000000000000000000',
      null,
    );
    expect(data?.resultType).toBe('Verified');
    expect(getBrnkcVerifiedSecurityData().resultType).toBe('Verified');
  });

  it('prefers API result when present', () => {
    const api = {
      ...getBrnkcVerifiedSecurityData(),
      resultType: 'Warning',
    };
    const data = resolveBrnkcSecurityData(
      'eip155:641230/erc20:0x0000000000000000000000000000000000000000',
      api,
    );
    expect(data?.resultType).toBe('Warning');
  });
});
