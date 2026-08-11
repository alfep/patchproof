/**
 * Checkout discount helpers (base / main).
 */

/**
 * Apply a percent-off coupon to a price.
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
  if (percentOff < 0 || percentOff > 100) {
    throw new RangeError("percentOff must be between 0 and 100");
  }
  return price * (1 - percentOff / 100);
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
