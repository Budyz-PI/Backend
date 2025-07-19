require("dotenv").config(); // to load .env during local dev

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { transferNFT } = require("./nft");

// Use global fetch (Node 18+). If <18, uncomment the next line:
// const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;
const NFT_PRICE = "4"; // 1 NFT = 4 Pi

const PI_API_KEY = process.env.PI_API_KEY;

app.use(bodyParser.json());
app.use(express.static("public"));

async function verifyPiPayment(paymentId) {
  // Call Pi Network API to verify the payment
  const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${PI_API_KEY}`
    }
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data;
}

app.post("/api/pi-payment", async (req, res) => {
  try {
    const { paymentData } = req.body;
    if (
      !paymentData ||
      !paymentData.amount ||
      !paymentData.metadata ||
      !paymentData.metadata.receiver ||
      !paymentData.paymentId
    ) {
      return res.json({ success: false, error: "Missing payment or address data." });
    }

    // Verify Pi payment via API
    const payment = await verifyPiPayment(paymentData.paymentId);
    if (!payment || payment.status !== "COMPLETED") {
      return res.json({ success: false, error: "Payment not completed or not found." });
    }

    // Double-check amount (as string, to match)
    if (String(payment.amount) !== NFT_PRICE) {
      return res.json({ success: false, error: "Incorrect payment amount." });
    }

    // Now transfer NFT
    const polygonAddress = paymentData.metadata.receiver;
    const { contractAddress, tokenId } = paymentData.metadata;
    const txHash = await transferNFT(polygonAddress, contractAddress, tokenId);
    res.json({ success: true, txHash });

  } catch (err) {
    console.error("Error in /api/pi-payment:", err);
    res.json({ success: false, error: "Server error." });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
