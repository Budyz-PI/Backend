const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Import routes
const paymentRoutes = require("./routes/payment");
app.use("/api", paymentRoutes);

// --- NFT Supply Counter Endpoint (START) ---
const nftSupply = require("./utils/nftSupply");

app.get("/api/nft/supply", (req, res) => {
  const remaining = nftSupply.getRemaining();
  res.json({
    remaining,
    soldOut: remaining <= 0,
  });
});
// --- NFT Supply Counter Endpoint (END) ---

// --- Friendly homepage route (START) ---
app.get('/', (req, res) => {
  res.send(`
    <h1>🎉 Budyz Backend is Running! 🎉</h1>
    <p>Welcome to the Budyz NFT backend service.</p>
    <ul>
      <li>API endpoints are available at <code>/api</code></li>
      <li>Check NFT supply at <code>/api/nft/supply</code></li>
    </ul>
    <p>Need help? Contact the Budyz team.</p>
  `);
});
// --- Friendly homepage route (END) ---

// --- Pi Validation Endpoint (START) ---
app.get("/.well-known/pi-validation", (req, res) => {
  res.send(process.env.PI_VALIDATION_KEY);
});
// --- Pi Validation Endpoint (END) ---

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
