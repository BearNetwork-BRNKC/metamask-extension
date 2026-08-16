import { submitBnesBridgeTransfer } from './bridge-client';

describe('bnes bridge-client', () => {
  it('posts BRNKC transfer with chain nonce and tx type', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        transferId: 'abc',
        status: 'released',
        feeTxHash: '0xfee',
        mainTxHash: '0xmain',
        releasedTx: '0xdest',
      }),
    });

    const result = await submitBnesBridgeTransfer(
      {
        sourceChain: 'bsc',
        destChain: 'bearnetworkchain',
        amount: '1000000000000000000',
        userAddress: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 7,
        observedTxType: '0x0',
        feeTxHash:
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        mainTxHash:
          '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      },
      { baseUrl: 'http://bridge.test', fetchImpl: fetchImpl as unknown as typeof fetch },
    );

    expect(result?.status).toBe('released');
    expect(fetchImpl.mock.calls[0][0]).toBe(
      'http://bridge.test/api/v1/bridge/transfer',
    );
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body as string);
    expect(body.nonce).toBe(7);
    expect(body.observedTxType).toBe('0x0');
    expect(body.sourceChain).toBe('bsc');
    expect(body.destChain).toBe('bearnetworkchain');
  });

  it('refuses non-BRNKC pairs before calling the API', async () => {
    const fetchImpl = jest.fn();
    await expect(
      submitBnesBridgeTransfer(
        {
          sourceChain: 'bsc',
          destChain: 'bsc',
          amount: '1',
          userAddress: '0x1234567890abcdef1234567890abcdef12345678',
          nonce: 1,
          feeTxHash:
            '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          mainTxHash:
            '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        },
        { fetchImpl: fetchImpl as unknown as typeof fetch },
      ),
    ).rejects.toThrow(/BRNKC only/u);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
