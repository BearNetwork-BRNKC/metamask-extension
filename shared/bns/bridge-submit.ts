/**
 * [BNES] Build the two official-wallet txs (fixed BNB fee + BRNKC principal).
 */

import { BigNumber } from 'bignumber.js';
import {
  BNS_BNES_BRIDGE_ADDRESS,
  BNS_BRIDGE_FEE_WEI,
  BNS_BSC_BRIDGE_ADDRESS,
  BNS_BSC_BRNKC_TOKEN,
} from './constants';
import { normalizeBnesBridgeChain } from './bridge-pair';
import type { BnesBridgeChain } from './bridge-pair';

export type BnesOfficialBridgeTxDraft = {
  chainIdHex: '0x38' | '0x9c8ce';
  to: string;
  valueWei: string;
  data?: string;
};

export function encodeErc20Transfer(to: string, amountWei: string): string {
  const addr = to.toLowerCase().replace(/^0x/u, '').padStart(64, '0');
  const amt = new BigNumber(amountWei).toString(16).padStart(64, '0');
  return `0xa9059cbb${addr}${amt}`;
}

export function decimalToWeiString(
  amount: string,
  decimals: number,
): string {
  return new BigNumber(amount)
    .shiftedBy(decimals)
    .integerValue(BigNumber.ROUND_DOWN)
    .toFixed(0);
}

export function planBnesOfficialBridgeTxs(args: {
  sourceChain: BnesBridgeChain;
  amountWei: string;
  userAddress: string;
}): { fee: BnesOfficialBridgeTxDraft; main: BnesOfficialBridgeTxDraft } {
  const source = normalizeBnesBridgeChain(args.sourceChain);
  if (!source) {
    throw new Error('unsupported BNES bridge source chain');
  }
  const fee: BnesOfficialBridgeTxDraft = {
    chainIdHex: '0x38',
    to: BNS_BSC_BRIDGE_ADDRESS,
    valueWei: BNS_BRIDGE_FEE_WEI,
  };
  if (source === 'bsc') {
    return {
      fee,
      main: {
        chainIdHex: '0x38',
        to: BNS_BSC_BRNKC_TOKEN,
        valueWei: '0',
        data: encodeErc20Transfer(BNS_BSC_BRIDGE_ADDRESS, args.amountWei),
      },
    };
  }
  return {
    fee,
    main: {
      chainIdHex: '0x9c8ce',
      to: BNS_BNES_BRIDGE_ADDRESS,
      valueWei: args.amountWei,
    },
  };
}
