/**
 * BNS integration surface for the MetaMask fork (additive, upstream-safe).
 */

export {
  isBnsRegistryConfigured,
  requireBareGatewayHost,
  requireNonZeroAddress,
  resolveBnsRuntimeConfig,
} from './config';
export type { BnsConfigSources, BnsRuntimeConfig } from './config';
export {
  BNS_CHAIN_ID_DECIMAL,
  BNS_CHAIN_ID_HEX,
  BNS_DEFAULT_IPFS_GATEWAY_HOST,
  BNS_DEFAULT_RPC_TIMEOUT_MS,
  BNS_FALLBACK_IPFS_GATEWAY_HOST,
  BNS_READ_RPC_URLS,
  BNS_RPC_QUORUM,
  BNS_SEED_REGISTRY_ADDRESS,
} from './constants';
export { decodeIpfsContenthash } from './contenthash';
export { toBnsResolveDisplay, toBnsResolveError } from './display';
export type {
  BnsResolveDisplay,
  BnsResolveDisplayErr,
  BnsResolveDisplayOk,
} from './display';
export {
  isSubDollarFiat,
  withSubDollarFiatDigits,
  wrapBnesFormatters,
} from './format-fiat';
export {
  decideBnsTabRedirect,
  extractBnesHostFromNavigationUrl,
  extractPathFromNavigationUrl,
} from './redirect-policy';
export type { BnsRedirectDecision } from './redirect-policy';
export {
  assertBnsReadRpcUrls,
  ethCallWithQuorum,
} from './quorum';
export type {
  EthCallQuorumOptions,
  JsonRpcEthCallRequest,
  QuorumFetch,
} from './quorum';
export { getBrnkcUsdPrice, clearBrnkcPriceCache } from './price';
export type { BrnkcPriceResult } from './price';
export {
  createBrnkcAwareTokenPricesService,
  priceWeiToUsdPerBrnkc,
  resolveBrnkcOraclePriceConfig,
  usdPerBrnkcToExchangeRateValue,
} from './brnkc-token-prices-service';
export type {
  BrnkcOraclePriceConfig,
  CreateBrnkcAwareTokenPricesServiceOptions,
  ExchangeRateLike,
  TokenPricesServiceLike,
} from './brnkc-token-prices-service';
export {
  BNS_BSC_BRIDGE_ADDRESS,
  BNS_BSC_BRNKC_TOKEN,
  BNS_BNES_BRIDGE_ADDRESS,
  BNS_BRIDGE_API_URL,
  BNS_BRIDGE_FEE_WEI,
  BNS_DEFAULT_BRIDGE_API_URL,
  BNS_DEFAULT_ORACLE_ADDRESS,
  BNS_DEFAULT_PRICE_API_URL,
  BNS_PRICE_API_URL,
  BNS_SEED_ORACLE_ADDRESS,
} from './constants';
export {
  getBnesOfficialBridgeDefaultToAsset,
  isBnesBscBrnkcBridgePair,
  isBnesOfficialBridgeSource,
  normalizeBnesBridgeChain,
} from './bridge-pair';
export type { BnesBridgeChain, BridgeAssetHint } from './bridge-pair';
export {
  fetchBnesBridgeStatus,
  submitBnesBridgeTransfer,
} from './bridge-client';
export {
  decimalToWeiString,
  encodeErc20Transfer,
  planBnesOfficialBridgeTxs,
} from './bridge-submit';
export type {
  BnesBridgeTransferRequest,
  BnesBridgeTransferResponse,
} from './bridge-client';
export {
  clearBrnkcSpotCache,
  fetchBrnkcHistory,
  fetchBrnkcSpot,
} from './price-api-client';
export type {
  BrnkcHistoryPeriod,
  BrnkcHistoryResponse,
  BrnkcSpotPercentChange,
  BrnkcSpotResponse,
} from './price-api-client';
export {
  historyPointsToPriceApiPrices,
  isBrnkcChartRequest,
  normalizeBrnkcHistoryPeriod,
  tryFetchBrnkcChartPrices,
} from './historical-prices';
export type { PriceApiChartPrices } from './historical-prices';
export {
  getBrnkcVerifiedSecurityData,
  isBrnkcNativeAssetId,
  isBrnkcNativeToken,
  resolveBrnkcSecurityData,
} from './verified-token';
export { resolveBnesContent } from './resolve';
export type {
  BnsEthCall,
  ResolveBnesContentOptions,
  ResolveBnesContentResult,
} from './resolve';
export {
  buildTrustedIpfsGatewayUrl,
  hasOnlyValidDnsLabels,
  isAllowedBnesHost,
  isAllowedGatewayUrl,
  isValidCid,
  normalizeBnesName,
} from './security';
