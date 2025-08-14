const fs = require("fs");
const path = require("path");

const MAX_SUPPLY = 2000; // Adjust as needed
const DATA_FILE = path.join(__dirname, "../nftSupply.json");

let mintedCount = 0;

// Load persisted minted count at startup
function loadMintedCount() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    mintedCount = data.mintedCount || 0;
  } catch (e) {
    mintedCount = 0;
  }
}

// Save minted count to file
function saveMintedCount() {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ mintedCount }), "utf8");
}

function getRemaining() {
  return Math.max(0, MAX_SUPPLY - mintedCount);
}

function incrementMintedCount(quantity = 1) {
  if (mintedCount + quantity > MAX_SUPPLY) {
    throw new Error("Exceeds max supply");
  }
  mintedCount += quantity;
  saveMintedCount();
}

function resetMintedCount() {
  mintedCount = 0;
  saveMintedCount();
}

// Initialize count at startup
loadMintedCount();

module.exports = {
  MAX_SUPPLY,
  getRemaining,
  incrementMintedCount,
  resetMintedCount,
};