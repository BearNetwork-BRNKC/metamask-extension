/**
 * [BNES] Submit the official-wallet BRNKC bridge (fee + principal + backend notify).
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import {
  decimalToWeiString,
  planBnesOfficialBridgeTxs,
} from '../../../shared/bns/bridge-submit';
import { normalizeBnesBridgeChain } from '../../../shared/bns/bridge-pair';
import { submitBnesBridgeTransfer } from '../../../shared/bns/bridge-client';
import {
  getFromAccount,
  getFromAmount,
  getFromToken,
  getToToken,
} from '../../ducks/bridge/selectors';
import {
  addTransactionAndWaitForPublish,
  findNetworkClientIdByChainId,
} from '../../store/actions';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { useEnableMissingNetwork } from './useEnableMissingNetwork';

function weiToHex(wei: string): Hex {
  return `0x${BigInt(wei).toString(16)}` as Hex;
}

function readPublishedNonce(nonce?: string): number {
  if (!nonce) {
    throw new Error('published transaction is missing nonce');
  }
  return Number.parseInt(nonce, 16);
}

function readPublishedType(type?: string | number): string {
  if (type === undefined || type === null || type === '') {
    return '0x0';
  }
  if (typeof type === 'number') {
    return `0x${type.toString(16)}`;
  }
  return type.startsWith('0x') ? type : `0x${type}`;
}

export default function useSubmitBnesOfficialBridge() {
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const fromAmount = useSelector(getFromAmount);
  const fromAccount = useSelector(getFromAccount);
  const enableMissingNetwork = useEnableMissingNetwork();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitBnesOfficialBridge = async () => {
    if (!fromToken || !toToken || !fromAmount || !fromAccount?.address) {
      throw new Error('BNES official bridge is missing token or amount');
    }
    const sourceChain = normalizeBnesBridgeChain(fromToken.chainId);
    const destChain = normalizeBnesBridgeChain(toToken.chainId);
    if (!sourceChain || !destChain) {
      throw new Error('BNES official bridge requires BSC ↔ BearNetworkChain');
    }

    setIsSubmitting(true);
    try {
      const amountWei = decimalToWeiString(fromAmount, fromToken.decimals ?? 18);
      const plan = planBnesOfficialBridgeTxs({
        sourceChain,
        amountWei,
        userAddress: fromAccount.address,
      });

      await enableMissingNetwork(plan.fee.chainIdHex);
      await enableMissingNetwork(plan.main.chainIdHex);
      const feeNetworkClientId = await findNetworkClientIdByChainId(
        plan.fee.chainIdHex,
      );
      const mainNetworkClientId = await findNetworkClientIdByChainId(
        plan.main.chainIdHex,
      );

      const feeMeta = await addTransactionAndWaitForPublish(
        {
          from: fromAccount.address as Hex,
          to: plan.fee.to as Hex,
          value: weiToHex(plan.fee.valueWei),
        },
        {
          networkClientId: feeNetworkClientId,
          requireApproval: true,
          type: TransactionType.simpleSend,
        },
      );
      if (!feeMeta.hash) {
        throw new Error('fee transaction was not published');
      }

      const mainMeta = await addTransactionAndWaitForPublish(
        {
          from: fromAccount.address as Hex,
          to: plan.main.to as Hex,
          value: weiToHex(plan.main.valueWei),
          data: plan.main.data as Hex | undefined,
        },
        {
          networkClientId: mainNetworkClientId,
          requireApproval: true,
          type: plan.main.data
            ? TransactionType.tokenMethodTransfer
            : TransactionType.simpleSend,
        },
      );
      if (!mainMeta.hash) {
        throw new Error('principal transaction was not published');
      }

      const result = await submitBnesBridgeTransfer({
        sourceChain,
        destChain,
        amount: amountWei,
        userAddress: fromAccount.address,
        recipientAddress: fromAccount.address,
        nonce: readPublishedNonce(mainMeta.txParams.nonce),
        observedTxType: readPublishedType(mainMeta.txParams.type),
        feeTxHash: feeMeta.hash,
        mainTxHash: mainMeta.hash,
        sourceTxHash: mainMeta.hash,
      });
      if (!result) {
        throw new Error('bridge backend rejected the transfer report');
      }
      navigate(DEFAULT_ROUTE, {
        state: { stayOnHomePage: true },
        replace: true,
      });
      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitBnesOfficialBridge, isSubmitting };
}
