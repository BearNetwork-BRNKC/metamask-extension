/**
 * [BNES] Official-wallet bridge is BRNKC-only: BSC ERC-20 ↔ BNES native.
 * No USDT/BNB (or any other asset) may enter BearNetworkChain this way.
 */

import { BEAR_NETWORK_CHAIN_CURRENCY_SYMBOL } from '../constants/bearnetworkchain';
import {
  BNS_BSC_BRNKC_TOKEN,
  BNS_CHAIN_ID_DECIMAL,
  BNS_CHAIN_ID_HEX,
  BRNKC_NATIVE_ADDRESS,
} from './constants';
import { isBrnkcNativeAssetId } from './verified-token';

export type BnesBridgeChain = 'bsc' | 'bearnetworkchain';

const ZERO = BRNKC_NATIVE_ADDRESS.toLowerCase();
const BSC_BRNKC = BNS_BSC_BRNKC_TOKEN.toLowerCase();
const BRNKC = BEAR_NETWORK_CHAIN_CURRENCY_SYMBOL.toUpperCase();

export type BridgeAssetHint = {
  chainId?: string | null;
  symbol?: string | null;
  address?: string | null;
  assetId?: string | null;
  isNative?: boolean | null;
};

export function normalizeBnesBridgeChain(
  chainId?: string | null,
): BnesBridgeChain | null {
  if (!chainId) {
    return null;
  }
  const v = chainId.trim().toLowerCase();
  if (
    v === '0x38' ||
    v === '56' ||
    v === 'eip155:56' ||
    v === 'bsc' ||
    v === 'bnb' ||
    v === 'binance'
  ) {
    return 'bsc';
  }
  if (
    v === BNS_CHAIN_ID_HEX.toLowerCase() ||
    v === String(BNS_CHAIN_ID_DECIMAL) ||
    v === `eip155:${BNS_CHAIN_ID_DECIMAL}` ||
    v === 'bearnetworkchain' ||
    v === 'bearnet' ||
    v === 'bnes'
  ) {
    return 'bearnetworkchain';
  }
  return null;
}

function isBrnkcOnBsc(asset: BridgeAssetHint): boolean {
  const symbol = (asset.symbol ?? '').toUpperCase();
  if (symbol && symbol !== BRNKC) {
    return false;
  }
  if (asset.isNative) {
    return false;
  }
  const id = (asset.assetId ?? '').toLowerCase();
  if (id.includes(`/erc20:${BSC_BRNKC}`)) {
    return true;
  }
  const addr = (asset.address ?? '').toLowerCase();
  if (!addr) {
    return symbol === BRNKC;
  }
  return addr === BSC_BRNKC;
}

function isBrnkcOnBnes(asset: BridgeAssetHint): boolean {
  if (isBrnkcNativeAssetId(asset.assetId)) {
    return true;
  }
  const symbol = (asset.symbol ?? '').toUpperCase();
  if (symbol && symbol !== BRNKC) {
    return false;
  }
  if (asset.isNative) {
    return true;
  }
  const addr = (asset.address ?? '').toLowerCase();
  return !addr || addr === ZERO || addr === '0x0';
}

export function isBnesOfficialBridgeSource(asset: BridgeAssetHint): boolean {
  const chain = normalizeBnesBridgeChain(asset.chainId);
  if (chain === 'bsc') {
    return isBrnkcOnBsc(asset);
  }
  if (chain === 'bearnetworkchain') {
    return isBrnkcOnBnes(asset);
  }
  return false;
}

export function getBnesOfficialBridgeDefaultToAsset(from: BridgeAssetHint): {
  assetId: string;
  symbol: string;
  name: string;
  decimals: number;
  address: string;
} | null {
  const chain = normalizeBnesBridgeChain(from.chainId);
  if (chain === 'bsc' && isBrnkcOnBsc(from)) {
    return {
      assetId: `eip155:${BNS_CHAIN_ID_DECIMAL}/erc20:${ZERO}`,
      symbol: BRNKC,
      name: 'BRNKC',
      decimals: 18,
      address: ZERO,
    };
  }
  if (chain === 'bearnetworkchain' && isBrnkcOnBnes(from)) {
    return {
      assetId: `eip155:56/erc20:${BSC_BRNKC}`,
      symbol: BRNKC,
      name: 'BRNKC',
      decimals: 18,
      address: BSC_BRNKC,
    };
  }
  return null;
}

/**
 * True only for BSC BRNKC ERC-20 ↔ BNES native BRNKC (either direction).
 */
export function isBnesBscBrnkcBridgePair(
  src: BridgeAssetHint,
  dest: BridgeAssetHint,
): boolean {
  const srcChain = normalizeBnesBridgeChain(src.chainId);
  const destChain = normalizeBnesBridgeChain(dest.chainId);
  if (!srcChain || !destChain || srcChain === destChain) {
    return false;
  }
  if (srcChain === 'bsc' && destChain === 'bearnetworkchain') {
    return isBrnkcOnBsc(src) && isBrnkcOnBnes(dest);
  }
  return isBrnkcOnBnes(src) && isBrnkcOnBsc(dest);
}
