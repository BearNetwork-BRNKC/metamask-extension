import { createFormatters } from '@metamask/client-utils';
import {
  isSubDollarFiat,
  withSubDollarFiatDigits,
  wrapBnesFormatters,
} from './format-fiat';

describe('shared/bns format-fiat', () => {
  it('flags sub-dollar amounts only', () => {
    expect(isSubDollarFiat(0.3274)).toBe(true);
    expect(isSubDollarFiat(-0.0021)).toBe(true);
    expect(isSubDollarFiat(1)).toBe(false);
    expect(isSubDollarFiat(0)).toBe(false);
    expect(isSubDollarFiat(Number.NaN)).toBe(false);
  });

  it('distinguishes a 0.63% move around $0.33', () => {
    const before = 1000.05 * 0.000327373;
    const after = 1000.05 * 0.0003301974;

    const twoDecimals = (n: number) => n.toFixed(2);
    expect(twoDecimals(before)).toBe(twoDecimals(after));

    const fmt = (n: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        ...withSubDollarFiatDigits(n),
      }).format(n);

    expect(fmt(before)).not.toBe(fmt(after));
    expect(fmt(before)).toMatch(/0\.327/);
    expect(fmt(after)).toMatch(/0\.330/);
  });

  it('wrapBnesFormatters leaves >= $1 at two decimals', () => {
    const fmt = wrapBnesFormatters(createFormatters({ locale: 'en-US' }));
    expect(fmt.formatCurrency(12.3, 'USD')).toBe('$12.30');
    expect(fmt.formatCurrencyWithMinThreshold(12.3, 'USD')).toBe('$12.30');
  });

  it('wrapBnesFormatters shows extra cents under $1', () => {
    const fmt = wrapBnesFormatters(createFormatters({ locale: 'en-US' }));
    const before = 1000.05 * 0.000327373;
    const after = 1000.05 * 0.0003301974;
    expect(fmt.formatCurrencyWithMinThreshold(before, 'USD')).not.toBe(
      fmt.formatCurrencyWithMinThreshold(after, 'USD'),
    );
    expect(fmt.formatCurrencyWithMinThreshold(before, 'USD')).toMatch(/0\.327/);
    expect(fmt.formatCurrencyCompact(0.0021, 'USD')).toMatch(/0\.0021/);
  });
});
