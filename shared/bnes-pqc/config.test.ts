import {
  BNES_PQC_CHAIN_ID,
  BNES_PQC_PREINSTALLED_MANIFEST_PATH,
  BNES_PQC_SNAP_ID,
  BNES_PQC_SNAP_VERSION,
} from './config';

describe('shared/bnes-pqc config', () => {
  it('pins the public, preinstalled mainnet Snap release', () => {
    expect(BNES_PQC_SNAP_ID).toBe('npm:@bearnetwork/bnes-pqc-snap');
    expect(BNES_PQC_SNAP_VERSION).toBe('0.1.1');
    expect(BNES_PQC_CHAIN_ID).toBe('0x9c8ce');
    expect(BNES_PQC_PREINSTALLED_MANIFEST_PATH).toBe(
      '@bearnetwork/bnes-pqc-snap/dist/preinstalled-snap.json',
    );
  });
});
