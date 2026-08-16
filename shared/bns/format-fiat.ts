/**
 * [BNES] Fork-only fiat formatter decorator.
 *
 * Sub-dollar holdings (typical BRNKC balances) need extra fraction digits
 * so a ~0.6% move is visible. 1,000.05 BRNKC × $0.000327 ≈ $0.3274, which
 * rounds to the same "$0.33" as $0.3302 at 2 decimal places.
 *
 * Placement: logic lives here under shared/bns. Upstream
 * `ui/hooks/useFormatters.ts` only wraps
 * `wrapBnesFormatters(createFormatters({ locale }))`.
 */

import { createFormatters } from '@metamask/client-utils';

export const SUB_DOLLAR_FIAT_DIGITS = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
} as const;

type Formatters = ReturnType<typeof createFormatters>;

export function isSubDollarFiat(value: number): boolean {
  return Number.isFinite(value) && value !== 0 && Math.abs(value) < 1;
}

export function withSubDollarFiatDigits(
  value: number,
  options: Intl.NumberFormatOptions = {},
): Intl.NumberFormatOptions {
  if (!isSubDollarFiat(value)) {
    return options;
  }
  return {
    ...options,
    ...SUB_DOLLAR_FIAT_DIGITS,
  };
}

/**
 * Decorate MetaMask formatters. Pass-through for amounts >= $1.
 *
 * @param base - Result of upstream `createFormatters({ locale })`.
 * @returns Same surface, with sub-dollar currency precision.
 */
export function wrapBnesFormatters(base: Formatters): Formatters {
  return {
    ...base,
    formatCurrency: (value, currency, options = {}) =>
      base.formatCurrency(
        value,
        currency,
        withSubDollarFiatDigits(Number(value), options),
      ),
    formatCurrencyWithMinThreshold: (value, currency) => {
      const number = Number(value);
      if (!Number.isFinite(number)) {
        return '';
      }
      if (isSubDollarFiat(number) && Math.abs(number) >= 0.01) {
        return base.formatCurrency(number, currency, SUB_DOLLAR_FIAT_DIGITS);
      }
      return base.formatCurrencyWithMinThreshold(value, currency);
    },
    formatCurrencyCompact: (value, currency) => {
      const number = Number(value);
      if (isSubDollarFiat(number)) {
        return base.formatCurrency(number, currency, SUB_DOLLAR_FIAT_DIGITS);
      }
      return base.formatCurrencyCompact(value, currency);
    },
  };
}
