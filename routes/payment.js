const nftSupply = require('../utils/nftSupply');
const express = require("express");
const fetch = require("node-fetch");
const { ethers } = require("ethers");
require("dotenv").config();

const router = express.Router();

// --- CONFIG ---
const PI_API_KEY = process.env.PI_API_KEY;
const NFT_CONTRACT_ADDRESS = "0x9eD1C16DA57aF4955a8b8975B882cdB82DBd2Ef7";
const NFT_SENDER_ADDRESS = "0x51a83f6c75c4309433ba6da2b1c075ae26254865";
const PI_RECEIVER_WALLET = "GDZLWRXDQHSIZBTVHFO2NAJOMD36BDNFULEUHN3BBQLLXKZ4ZJC4DRCS";
const NFT_PRICE_PI = 4;
const NFT_TOKEN_ID = 10;

const PI_API_URL = "https://api.minepi.com/v2/payments";

const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL;
const SENDER_PRIVATE_KEY = process.env.SENDER_PRIVATE_KEY;

const NFT_ABI = [
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) external",
];

// --- EXISTING ROUTE ---
router.post("/verify-and-deliver", async (req, res) => {
  const { paymentId, recipientEvmAddress, recipientSolAddress, quantity } = req.body;

  const numToBuy = parseInt(quantity, 10) > 0 ? parseInt(quantity, 10) : 1;

  const MAX_PER_TX = 10;
  if (numToBuy > MAX_PER_TX) {
    return res.status(400).json({ error: `You can only buy up to ${MAX_PER_TX} NFTs per purchase.` });
  }

  if (!paymentId || !recipientEvmAddress || !recipientSolAddress) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const piResponse = await fetch(`${PI_API_URL}/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Key ${PI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!piResponse.ok) {
      console.error("Pi payment verification failed", piResponse.status, await piResponse.text());
      return res.status(500).json({ error: "Could not verify Pi payment" });
    }

    const payment = await piResponse.json();

    if (
      payment.status !== "completed" ||
      payment.to !== PI_RECEIVER_WALLET ||
      parseFloat(payment.amount) < numToBuy * NFT_PRICE_PI
    ) {
      return res.status(400).json({ error: "Invalid payment" });
    }

    if (nftSupply.getRemaining() < numToBuy) {
      return res.status(400).json({ error: "Not enough NFTs left!" });
    }

    const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    const wallet = new ethers.Wallet(SENDER_PRIVATE_KEY, provider);
    const nftContract = new ethers.Contract(
      NFT_CONTRACT_ADDRESS,
      NFT_ABI,
      wallet,
    );

    const tx = await nftContract.safeTransferFrom(
      NFT_SENDER_ADDRESS,
      recipientEvmAddress,
      NFT_TOKEN_ID,
      numToBuy,
      "0x"
    );
    await tx.wait();

    nftSupply.incrementMintedCount(numToBuy);

    return res.json({
      success: true,
      message: `${numToBuy} NFT(s) delivered!`,
      txHash: tx.hash,
      solanaAddressStored: recipientSolAddress,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// --- NEW ROUTE: VERIFY JWT SESSION ---
router.post("/verify-user", async (req, res) => {
  const { jwt } = req.body;

  if (!jwt) {
    return res.status(400).json({ error: "Missing JWT" });
  }

  try {
    const response = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      console.error("Pi /me verification failed", response.status, await response.text());
      return res.status(500).json({ error: "Could not verify user session" });
    }

    const user = await response.json();

    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
