// backend/utils/nftSupply.js

/**
 * Deprecated: No actual minting or supply tracking now.
 * 
 * This module is retained for compatibility but only provides
 * an empty shell and static max supply value.
 * 
 * All functions are no-ops or return static values.
 */

const MAX_SUPPLY = 2000;

// Returns the max supply (for reference only)
function getMaxSupply() {
  return MAX_SUPPLY;
}

// Returns static max supply (all NFTs are pre-minted)
function getRemaining() {
  return MAX_SUPPLY;
}

// No-op: increment is disabled as minting is not performed here
function incrementMintedCount(quantity = 1) {
  // No action needed; NFTs are already minted
}

// No-op: reset is disabled
function resetMintedCount() {
  // No action needed
}

module.exports = {
  MAX_SUPPLY,
  getMaxSupply,
  getRemaining,
  incrementMintedCount,
  resetMintedCount,
};