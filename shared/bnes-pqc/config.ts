import type { SnapId } from '@metamask/snaps-sdk';

/**
 * BearNetwork-specific PQC Snap metadata.
 *
 * Keep this module isolated: only the two preload registries import it, so
 * upstream MetaMask transaction and provider behaviour remains unchanged.
 */
export const BNES_PQC_SNAP_ID =
  'npm:@bearnetwork/bnes-pqc-snap' as SnapId;

export const BNES_PQC_SNAP_VERSION = '0.1.1' as const;

export const BNES_PQC_CHAIN_ID = '0x9c8ce' as const;

export const BNES_PQC_PREINSTALLED_MANIFEST_PATH =
  '@bearnetwork/bnes-pqc-snap/dist/preinstalled-snap.json' as const;
