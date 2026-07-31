import {
  FeeType,
  sumAmounts,
  type DeepPartial,
  type QuoteResponse,
} from '@metamask/bridge-controller';
import { parseCaipAssetType } from '@metamask/utils';

export const getGasFees = (quote?: QuoteResponse) => {
  return sumAmounts(quote?.quote.feeData[FeeType.NETWORK]);
};

export const getTotalNetworkFee = (quote?: QuoteResponse | null) => {
  return sumAmounts(
    quote?.quote.feeData[FeeType.NETWORK],
    quote?.quote.feeData[FeeType.RELAYER],
  );
};

export const getIncludedTxFees = (quote?: QuoteResponse | null) => {
  return sumAmounts(quote?.quote.feeData[FeeType.TX_FEE]);
};

export const getDestChainId = (quote: QuoteResponse) => {
  const destAssetId = quote.quote.dest.asset.assetId;
  return parseCaipAssetType(destAssetId).chainId;
};

export const getPriceImpactNumber = (quote?: QuoteResponse | null) => {
  const priceImpactNumber = Number(quote?.quote.priceData?.priceImpact?.amount);
  if (Number.isNaN(priceImpactNumber)) {
    return null;
  }
  return priceImpactNumber;
};
