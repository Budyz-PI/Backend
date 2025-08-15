const express = require("express");
const fetch = require("node-fetch");
const { ethers } = require("ethers");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
require("dotenv").config();

const router = express.Router();

// Persistent logger setup (Winston)
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});
if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

// Rate limiting middleware: max 10 requests per 10 minutes per IP
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many requests, please try again later." }
});
router.use(limiter);

// --- CONFIG (Env Only) ---
const PI_API_KEY = process.env.PI_API_KEY;
const NFT_CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS;
const NFT_SENDER_ADDRESS = process.env.NFT_SENDER_ADDRESS;
const PI_RECEIVER_WALLET = process.env.PI_RECEIVER_WALLET;
const NFT_PRICE_PI = parseFloat(process.env.NFT_PRICE_PI) || 4;
const NFT_TOKEN_ID = parseInt(process.env.NFT_TOKEN_ID) || 10;
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL;
const SENDER_PRIVATE_KEY = process.env.SENDER_PRIVATE_KEY;

const PI_API_URL = "https://api.minepi.com/v2/payments";
const MAX_PER_TX = parseInt(process.env.MAX_PER_TX) || 10;
const PER_WALLET_CAP = 10;

// --- ABI (Externalize if large) ---
const NFT_ABI = [
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) external",
  "function balanceOf(address account, uint256 id) view returns (uint256)", // For cap check
];

// --- Middleware: Authenticate Pi User ---
function authenticatePiUser(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ success: false, error: "Unauthorized. Login with Pi first." });
  }
  next();
}

// --- Helper: Validate EVM Address ---
function isValidAddress(address) {
  return ethers.isAddress(address);
}

// --- ROUTE: Verify Payment & Deliver NFT ---
router.post(
  "/verify-and-deliver",
  authenticatePiUser,
  [
    body("paymentId").notEmpty().trim(),
    body("recipientEvmAddress").custom((val) => isValidAddress(val)).withMessage("Invalid EVM address"),
    body("quantity").isInt({ min: 1, max: MAX_PER_TX }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn("Validation failed", { errors: errors.array() });
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { paymentId, recipientEvmAddress, quantity } = req.body;
    const numToBuy = parseInt(quantity, 10);

    try {
      // --- Verify Pi Payment ---
      const piResponse = await fetch(`${PI_API_URL}/${paymentId}`, {
        method: "GET",
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!piResponse.ok) {
        const errorText = await piResponse.text();
        logger.error("Pi API Error", { status: piResponse.status, errorText });
        return res.status(400).json({ success: false, error: "Invalid Pi payment", detail: errorText });
      }

      let payment;
      try {
        payment = await piResponse.json();
      } catch (jsonError) {
        logger.error("Pi Payment JSON Error", { jsonError });
        return res.status(500).json({ success: false, error: "Could not parse Pi payment response" });
      }

      if (
        payment.status !== "completed" ||
        payment.to !== PI_RECEIVER_WALLET ||
        parseFloat(payment.amount) < numToBuy * NFT_PRICE_PI
      ) {
        logger.warn("Payment validation failed", {
          status: payment.status,
          to: payment.to,
          amount: payment.amount
        });
        return res.status(400).json({ success: false, error: "Payment validation failed" });
      }

      // --- Enforce Cap: Check NFTs already owned by this wallet ---
      const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
      const wallet = new ethers.Wallet(SENDER_PRIVATE_KEY, provider);
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, wallet);

      let currentOwned = 0;
      try {
        currentOwned = await nftContract.balanceOf(recipientEvmAddress, NFT_TOKEN_ID);
        currentOwned = Number(currentOwned);
      } catch (err) {
        logger.error("Error fetching wallet NFT balance", { err });
        return res.status(500).json({ success: false, error: "Could not fetch wallet NFT balance" });
      }

      if (currentOwned + numToBuy > PER_WALLET_CAP) {
        logger.warn("Wallet NFT cap exceeded", {
          currentOwned,
          numToBuy,
          PER_WALLET_CAP
        });
        return res.status(400).json({
          success: false,
          error: `Wallet NFT cap exceeded (max ${PER_WALLET_CAP} per wallet). You currently own ${currentOwned}.`,
        });
      }

      // --- Send NFT on Polygon ---
      let tx;
      try {
        tx = await nftContract.safeTransferFrom(
          NFT_SENDER_ADDRESS,
          recipientEvmAddress,
          NFT_TOKEN_ID,
          numToBuy,
          "0x"
        );
        await tx.wait();
      } catch (blockchainError) {
        logger.error("Blockchain Transaction Error", { blockchainError });
        return res.status(500).json({
          success: false,
          error: blockchainError.reason || blockchainError.message || "Blockchain transaction failed"
        });
      }

      logger.info("NFT(s) delivered", {
        txHash: tx.hash,
        recipient: recipientEvmAddress,
        amount: numToBuy
      });

      return res.json({
        success: true,
        message: `${numToBuy} NFT(s) delivered!`,
        txHash: tx.hash,
        nftsOwnedNow: currentOwned + numToBuy,
      });

    } catch (error) {
      logger.error("General Transaction Error", { error });
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }
);

module.exports = router;