/**
 * BNS (BearNetwork Name Service) constants for the MetaMask fork.
 *
 * Kept under shared/bns/ so upstream merges never need to touch these files.
 * Network IDs remain in shared/constants/bearnetworkchain.ts.
 */

import {
  BEAR_NETWORK_CHAIN_FAILOVER_URLS,
  BEAR_NETWORK_CHAIN_ID,
  BEAR_NETWORK_CHAIN_RPC_URL,
} from '../constants/bearnetworkchain';

/** Preferred path-style IPFS gateway host for BNS contenthash resolution. */
export const BNS_DEFAULT_IPFS_GATEWAY_HOST = 'ipfs.bearnetwork.net';

/** Fallback gateway host used only when the primary is explicitly overridden. */
export const BNS_FALLBACK_IPFS_GATEWAY_HOST = 'ipfs.io';

/**
 * Three canonical HTTPS RPC origins for read quorum (3-of-2).
 * Primary + first two failover URLs — must stay unique and HTTPS-only.
 */
export const BNS_READ_RPC_URLS = [
  BEAR_NETWORK_CHAIN_RPC_URL,
  BEAR_NETWORK_CHAIN_FAILOVER_URLS[0],
  BEAR_NETWORK_CHAIN_FAILOVER_URLS[1],
] as const;

export const BNS_CHAIN_ID_HEX = BEAR_NETWORK_CHAIN_ID;
export const BNS_CHAIN_ID_DECIMAL = 641230;
export const BNS_RPC_QUORUM = 2;
export const BNS_DEFAULT_RPC_TIMEOUT_MS = 10_000;

/**
 * Minimal ABIs used by the BNS resolver entry. Full contract ABIs live in bns/.
 */
export const BNS_REGISTRY_RESOLVER_FRAGMENT =
  'function resolver(bytes32 node) view returns (address)';

export const BNS_RESOLVER_CONTENTHASH_FRAGMENT =
  'function contenthash(bytes32 node) view returns (bytes)';

/**
 * Optional seed registry address from build-time env. Empty means "not
 * configured yet" — resolve must fail closed rather than guess.
 */
export const BNS_SEED_REGISTRY_ADDRESS =
  (typeof process !== 'undefined' &&
    process.env.BNS_REGISTRY_ADDRESS &&
    process.env.BNS_REGISTRY_ADDRESS.trim()) ||
  '';

/**
 * Production BNESOracle (BRNKC/USD) on BearNetworkChain mainnet.
 * Used when build env does not inject BNES_ORACLE_ADDRESS.
 */
export const BNS_DEFAULT_ORACLE_ADDRESS =
  '0xA3e9Dc4Fd7032Db1F4e8C8e776B3a7f23a65a85E';

/**
 * BNESOracle address for BRNKC/USD price queries.
 * Prefer build-time `BNES_ORACLE_ADDRESS` (builds.yml / .metamaskrc); fall back
 * to the production mainnet deployment so wallet fiat works out of the box.
 */
export const BNS_SEED_ORACLE_ADDRESS =
  (typeof process !== 'undefined' &&
    process.env.BNES_ORACLE_ADDRESS &&
    process.env.BNES_ORACLE_ADDRESS.trim()) ||
  BNS_DEFAULT_ORACLE_ADDRESS;

/**
 * BRNKC token addresses.
 */
export const BRNKC_NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';
export const BRNKC_USD_VIRTUAL_ADDRESS = '0x0000000000000000000000000000000000000001';

/**
 * Oracle price cache TTL in milliseconds.
 * Matches keeper interval (300s) — no point polling faster than updates.
 */
export const BNS_ORACLE_PRICE_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Off-chain BRNKC price history HTTP API (Oracle Keeper sidecar).
 * Public host: https://oracle.bearnetwork.net (spot + history).
 * Override with BNES_PRICE_API_URL for local docker (:8787) if needed.
 */
export const BNS_DEFAULT_PRICE_API_URL = 'https://oracle.bearnetwork.net';

/**
 * Official Crosschain-Bridge HTTP API (same backend as the standalone web app).
 * Override with BNES_BRIDGE_API_URL for production hosting.
 */
export const BNS_DEFAULT_BRIDGE_API_URL = 'http://127.0.0.1:27431';

export const BNS_BRIDGE_API_URL =
  (typeof process !== 'undefined' &&
    process.env.BNES_BRIDGE_API_URL &&
    process.env.BNES_BRIDGE_API_URL.trim()) ||
  BNS_DEFAULT_BRIDGE_API_URL;

/** BSC ERC-20 BRNKC — the only token this fork may bridge. */
export const BNS_BSC_BRNKC_TOKEN =
  '0x022AbC37223134b0c089a56fFCBB3D41C71C4C5c';

/** Official hot-wallet receivers (user sends BRNKC here). */
export const BNS_BSC_BRIDGE_ADDRESS =
  '0x022AbC37223134b0c089a56fFCBB3D41C71C4C5c';
export const BNS_BNES_BRIDGE_ADDRESS =
  '0xA2813B5E2c8a7420aBE793A8BEC898b8cF319685';

/** Fixed BSC fee, wei (0.001 BNB). */
export const BNS_BRIDGE_FEE_WEI = '1000000000000000';

export const BNS_PRICE_API_URL =
  (typeof process !== 'undefined' &&
    process.env.BNES_PRICE_API_URL &&
    process.env.BNES_PRICE_API_URL.trim()) ||
  BNS_DEFAULT_PRICE_API_URL;
