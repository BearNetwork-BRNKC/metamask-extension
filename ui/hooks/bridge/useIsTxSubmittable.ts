import { useSelector, shallowEqual } from 'react-redux';
import {
  getBridgeQuotes,
  getFromAmount,
  getFromToken,
  getValidationErrors,
  getToToken,
} from '../../ducks/bridge/selectors';
import { getMultichainCurrentChainId } from '../../selectors/multichain';
import { useMultichainSelector } from '../useMultichainSelector';
// [BNES] Official-wallet BRNKC path does not use Codefi quotes
import { isBnesBscBrnkcBridgePair } from '../../../shared/bns/bridge-pair';

export const useIsTxSubmittable = () => {
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const fromChainId = useMultichainSelector(getMultichainCurrentChainId);
  const fromAmount = useSelector(getFromAmount);
  const { activeQuote } = useSelector(getBridgeQuotes);

  const {
    isInsufficientBalance,
    isInsufficientGasBalance,
    isInsufficientNativeReserve,
    isInsufficientGasForQuote,
    isNetworkFeeUnavailable,
    isTxAlertPresent,
    isTxAlertLoading,
  } = useSelector(getValidationErrors, shallowEqual);

  if (isBnesBscBrnkcBridgePair(fromToken ?? {}, toToken ?? {})) {
    return Boolean(
      fromToken &&
      toToken &&
      fromChainId &&
      fromAmount &&
      !isInsufficientBalance &&
      !(isTxAlertLoading || isTxAlertPresent),
    );
  }

  return Boolean(
    fromToken &&
    toToken &&
    fromChainId &&
    fromAmount &&
    activeQuote &&
    !isInsufficientBalance &&
    !isInsufficientGasBalance &&
    !isInsufficientGasForQuote &&
    !isInsufficientNativeReserve &&
    !isNetworkFeeUnavailable &&
    !(isTxAlertLoading || isTxAlertPresent),
  );
};
