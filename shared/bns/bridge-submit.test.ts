import {
  encodeErc20Transfer,
  planBnesOfficialBridgeTxs,
} from './bridge-submit';
import { BNS_BSC_BRIDGE_ADDRESS, BNS_BRIDGE_FEE_WEI } from './constants';

describe('bnes official-bridge submit planner', () => {
  it('plans BSC fee then ERC-20 BRNKC transfer', () => {
    const plan = planBnesOfficialBridgeTxs({
      sourceChain: 'bsc',
      amountWei: '1000000000000000000',
      userAddress: '0x1234567890abcdef1234567890abcdef12345678',
    });
    expect(plan.fee.chainIdHex).toBe('0x38');
    expect(plan.fee.valueWei).toBe(BNS_BRIDGE_FEE_WEI);
    expect(plan.main.data).toBe(
      encodeErc20Transfer(BNS_BSC_BRIDGE_ADDRESS, '1000000000000000000'),
    );
    expect(plan.main.data?.startsWith('0xa9059cbb')).toBe(true);
  });

  it('plans BSC fee then BNES native BRNKC send', () => {
    const plan = planBnesOfficialBridgeTxs({
      sourceChain: 'bearnetworkchain',
      amountWei: '2000000000000000000',
      userAddress: '0x1234567890abcdef1234567890abcdef12345678',
    });
    expect(plan.fee.chainIdHex).toBe('0x38');
    expect(plan.main.chainIdHex).toBe('0x9c8ce');
    expect(plan.main.valueWei).toBe('2000000000000000000');
    expect(plan.main.data).toBeUndefined();
  });
});
