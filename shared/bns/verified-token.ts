/**
 * [BNES] Fork-only: treat native BRNKC as a Verified token for Security & Trust UI.
 *
 * Upstream MetaMask loads verification from tokens.api (Codefi). BRNKC is not
 * listed there, so we inject a local Verified payload for BNES native only.
 *
 * UI copy uses existing i18n keys:
 *   securityTrustVerifiedTokenTitle → "Verified token"
 *   securityTrustVerifiedTokenDescription → "$1 is actively traded..."
 */

import type { TokenSecurityData } from '@metamask/assets-controllers';
import {
  BEAR_NETWORK_CHAIN_CURRENCY_SYMBOL,
  BEAR_NETWORK_CHAIN_ID,
} from '../constants/bearnetworkchain';
import { BNS_CHAIN_ID_DECIMAL, BRNKC_NATIVE_ADDRESS } from './constants';

const ZERO = BRNKC_NATIVE_ADDRESS.toLowerCase();
const CHAIN_HEX = BEAR_NETWORK_CHAIN_ID.toLowerCase();
const CHAIN_DEC = String(BNS_CHAIN_ID_DECIMAL);
const CAIP_CHAIN = `eip155:${CHAIN_DEC}`;

/**
 * Whether a CAIP-19 asset id refers to BNES native BRNKC.
 * Accepts slip44 or erc20:0x0 forms used by the asset page.
 *
 * @param assetId - CAIP-19 asset id.
 */
export function isBrnkcNativeAssetId(
  assetId: string | null | undefined,
): boolean {
  if (!assetId || typeof assetId !== 'string') {
    return false;
  }
  const id = assetId.trim().toLowerCase();
  if (!id.startsWith(`${CAIP_CHAIN}/`)) {
    return false;
  }
  if (id === `${CAIP_CHAIN}/erc20:${ZERO}`) {
    return true;
  }
  if (id.startsWith(`${CAIP_CHAIN}/slip44:`)) {
    return true;
  }
  return false;
}

/**
 * Whether token metadata describes BNES native BRNKC (fallback when CAIP missing).
 *
 * @param token - Minimal token identity.
 */
export function isBrnkcNativeToken(token: {
  symbol?: string | null;
  chainId?: string | null;
  address?: string | null;
  isNative?: boolean | null;
}): boolean {
  const symbol = (token.symbol ?? '').toUpperCase();
  if (symbol !== BEAR_NETWORK_CHAIN_CURRENCY_SYMBOL) {
    return false;
  }
  const chain = (token.chainId ?? '').toLowerCase();
  const chainOk =
    chain === CHAIN_HEX ||
    chain === CHAIN_DEC ||
    chain === CAIP_CHAIN ||
    chain === BEAR_NETWORK_CHAIN_ID.toLowerCase();
  if (!chainOk) {
    return false;
  }
  if (token.isNative) {
    return true;
  }
  const addr = (token.address ?? '').toLowerCase();
  return !addr || addr === ZERO || addr === '0x0';
}

/**
 * Local Verified security payload for BRNKC (matches TokenSecurityData shape).
 * Features map to existing i18n labels on the Security & Trust sheet.
 */
export function getBrnkcVerifiedSecurityData(): TokenSecurityData {
  return {
    resultType: 'Verified',
    maliciousScore: '0',
    fees: {
      transfer: 0,
      transferFeeMaxAmount: null,
      buy: 0,
      sell: null,
    },
    features: [
      {
        featureId: 'HIGH_REPUTATION_TOKEN',
        type: 'Info',
        description: 'High reputation token',
      },
      {
        featureId: 'HIGH_TRADE_VOLUME',
        type: 'Info',
        description: 'High trade volume',
      },
      {
        featureId: 'VERIFIED_CONTRACT',
        type: 'Info',
        description: 'Verified contract',
      },
    ],
    financialStats: {
      supply: 0,
      topHolders: [],
      holdersCount: 0,
      tradeVolume24h: null,
      lockedLiquidityPct: null,
      markets: [],
    },
    metadata: {
      externalLinks: {
        homepage: 'https://bearnetwork.net',
        twitterPage: null,
        telegramChannelId: null,
      },
    },
    created: '',
  };
}

/**
 * Prefer API security data unless missing; then inject BRNKC Verified.
 *
 * @param assetId - CAIP-19 id being queried.
 * @param fromApi - Security data returned by MetaMask token API (may be null).
 */
export function resolveBrnkcSecurityData(
  assetId: string | null | undefined,
  fromApi: TokenSecurityData | null | undefined,
): TokenSecurityData | null {
  if (fromApi?.resultType) {
    return fromApi;
  }
  if (isBrnkcNativeAssetId(assetId)) {
    return getBrnkcVerifiedSecurityData();
  }
  return fromApi ?? null;
}
