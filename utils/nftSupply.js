// Example utils/nftSupply.js for managing ERC-1155 supply

const MAX_SUPPLY = 2000; // Adjust to your collection cap

let mintedCount = 0;

// Returns the number of NFTs left to be distributed
function getRemaining() {
  return Math.max(0, MAX_SUPPLY - mintedCount);
}

// Increments minted count by quantity (for multi-buy)
function incrementMintedCount(quantity = 1) {
  mintedCount += quantity;
}

// Optionally: Reset (for testing/admin only!)
function resetMintedCount() {
  mintedCount = 0;
}

module.exports = {
  MAX_SUPPLY,
  getRemaining,
  incrementMintedCount,
  resetMintedCount,
};