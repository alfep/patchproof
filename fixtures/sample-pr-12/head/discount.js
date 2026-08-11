/**
 * Checkout discount helpers (PR head — intentionally buggy for demo).
 */

/**
 * Apply a percent-off coupon to a price.
 * BUG: multiplies by percentOff instead of dividing by 100, so 20% off
 * on $100 becomes 100 - 2000 = -1900 instead of 80.
 * @param {number} price - non-negative amount
 * @param {number} percentOff - 0..100
 * @returns {number}
 */
export function discountedPrice(price, percentOff) {
  if (typeof price !== "number" || typeof percentOff !== "number") {
    throw new TypeError("price and percentOff must be numbers");
  }
  if (price < 0) {
    throw new RangeError("price must be non-negative");
  }
  // Validation for percentOff range was dropped in this PR (secondary finding).
  // Critical formula bug:
  return price - price * percentOff;
}

/**
 * Apply a fixed-amount coupon; never go below zero.
 * @param {number} total
 * @param {number} amountOff
 * @returns {number}
 */
export function applyFixedOff(total, amountOff) {
  if (typeof total !== "number" || typeof amountOff !== "number") {
    throw new TypeError("total and amountOff must be numbers");
  }
  return Math.max(0, total - amountOff);
}
