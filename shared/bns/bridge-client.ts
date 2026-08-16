/**
 * [BNES] HTTP client for the official-wallet Crosschain-Bridge backend.
 * Same contract as the standalone web app (POST /api/v1/bridge/transfer).
 */

import {
  BNS_BRIDGE_API_URL,
  BNS_BRIDGE_FEE_WEI,
} from './constants';
import type { BnesBridgeChain } from './bridge-pair';
import { isBnesBscBrnkcBridgePair } from './bridge-pair';

export type BnesBridgeTransferRequest = {
  sourceChain: BnesBridgeChain;
  destChain: BnesBridgeChain;
  amount: string;
  userAddress: string;
  recipientAddress?: string;
  nonce: number;
  feeTxHash: string;
  mainTxHash: string;
  sourceTxHash?: string;
  observedTxType?: string;
  clientSubmittedAt?: string;
};

export type BnesBridgeTransferResponse = {
  success: boolean;
  transferId: string;
  status: string;
  feeTxHash: string;
  mainTxHash: string;
  releasedTx?: string;
  message?: string;
};

function resolveBaseUrl(baseUrl?: string): string {
  return (baseUrl ?? BNS_BRIDGE_API_URL).trim().replace(/\/+$/u, '');
}

function assertBrnkcOnly(req: BnesBridgeTransferRequest): void {
  const srcNative = req.sourceChain === 'bearnetworkchain';
  const destNative = req.destChain === 'bearnetworkchain';
  if (
    !isBnesBscBrnkcBridgePair(
      { chainId: req.sourceChain, symbol: 'BRNKC', isNative: srcNative },
      { chainId: req.destChain, symbol: 'BRNKC', isNative: destNative },
    )
  ) {
    throw new Error('BNES bridge accepts BRNKC only (BSC ERC-20 ↔ BNES native)');
  }
}

export async function submitBnesBridgeTransfer(
  request: BnesBridgeTransferRequest,
  options?: { baseUrl?: string; fetchImpl?: typeof fetch },
): Promise<BnesBridgeTransferResponse | null> {
  assertBrnkcOnly(request);
  const base = resolveBaseUrl(options?.baseUrl);
  if (!base) {
    return null;
  }
  const fetchFn = options?.fetchImpl ?? globalThis.fetch;
  if (typeof fetchFn !== 'function') {
    return null;
  }
  const res = await fetchFn(`${base}/api/v1/bridge/transfer`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      ...request,
      sourceTxHash: request.sourceTxHash ?? request.mainTxHash,
      recipientAddress: request.recipientAddress ?? request.userAddress,
      clientSubmittedAt:
        request.clientSubmittedAt ?? new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as BnesBridgeTransferResponse;
  if (!data?.transferId || !data.status) {
    return null;
  }
  return data;
}

export async function fetchBnesBridgeStatus(
  idOrTxHash: string,
  options?: { baseUrl?: string; fetchImpl?: typeof fetch },
): Promise<{ status: string; releasedTx?: string } | null> {
  const base = resolveBaseUrl(options?.baseUrl);
  if (!base || !idOrTxHash) {
    return null;
  }
  const fetchFn = options?.fetchImpl ?? globalThis.fetch;
  if (typeof fetchFn !== 'function') {
    return null;
  }
  const res = await fetchFn(
    `${base}/api/v1/bridge/status/${encodeURIComponent(idOrTxHash)}`,
    { method: 'GET', headers: { accept: 'application/json' } },
  );
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as {
    status?: string;
    releasedTx?: string;
  };
  if (!data?.status) {
    return null;
  }
  return { status: data.status, releasedTx: data.releasedTx };
}

export const BNES_BRIDGE_FIXED_FEE_WEI = BNS_BRIDGE_FEE_WEI;
