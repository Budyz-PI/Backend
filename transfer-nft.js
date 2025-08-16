require('dotenv').config();
const { ethers } = require('ethers');
const contractABI = require('./ERC1155_ABI.json'); // Make sure this file exists with your ABI

// Use your existing .env variable names
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL); // <-- You'll still need to add this one!
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contractAddress = process.env.NFT_Contract_Address;
const tokenId = process.env.TOKEN_ID;

const contract = new ethers.Contract(contractAddress, contractABI, wallet);

async function transferNFT(to, amount = 1) {
  // `from` is wallet.address (sender), `to` is recipient, `id` is tokenId, `amount` is number of NFTs, `data` is empty by default
  const tx = await contract.safeTransferFrom(
    wallet.address,
    to,
    tokenId,
    amount,
    "0x"
  );
  await tx.wait();
  return tx.hash;
}

// Example usage (for testing):
// (async () => {
//   try {
//     const txHash = await transferNFT('0xRecipientAddress', 1);
//     console.log('NFT transferred, tx:', txHash);
//   } catch (err) {
//     console.error('Transfer error:', err);
//   }
// })();

module.exports = { transferNFT };