require('dotenv').config();
const { ethers } = require('ethers');
const contractABI = require('./ERC1155_ABI.json'); // Make sure this file exists with your ABI

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contractAddress = process.env.NFT_Contract_Address;
const tokenId = process.env.TOKEN_ID;

const contract = new ethers.Contract(contractAddress, contractABI, wallet);

async function transferNFT(to, amount = 1) {
  console.log('Attempting NFT transfer:', { from: wallet.address, to, tokenId, amount });
  try {
    const tx = await contract.safeTransferFrom(
      wallet.address,
      to,
      tokenId,
      amount,
      "0x"
    );
    console.log('Transaction sent, hash:', tx.hash);
    await tx.wait();
    console.log('Transaction confirmed, hash:', tx.hash);
    return tx.hash;
  } catch (err) {
    console.error('NFT transfer failed:', err);
    throw err;
  }
}

module.exports = { transferNFT };