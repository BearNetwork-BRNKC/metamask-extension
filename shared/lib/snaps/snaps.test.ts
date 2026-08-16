import { BNES_PQC_SNAP_ID } from '../../bnes-pqc/config';
import { PREINSTALLED_SNAPS, isSnapPreinstalled } from './snaps';

describe('preinstalled Snap registry', () => {
  it('includes the BearNetwork PQC Snap without changing other Snap semantics', () => {
    expect(PREINSTALLED_SNAPS).toContain(BNES_PQC_SNAP_ID);
    expect(isSnapPreinstalled(BNES_PQC_SNAP_ID)).toBe(true);
  });
});
