const express = require("express");
const cors = require("cors");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const fetch = require("node-fetch");
require("dotenv").config();

// --- Initialize App ---
const app = express();

// --- Trust Proxy (for Replit/Render/Heroku/etc) ---
app.set('trust proxy', 1); // Trust first proxy for accurate IP & session

// --- Environment Validation ---
const criticalEnv = [
  "PI_VALIDATION_KEY",
  "SESSION_SECRET",
  "NFT_CONTRACT_ADDRESS",
  "NFT_SENDER_ADDRESS",
  "PI_RECEIVER_WALLET",
  "NFT_PRICE_PI",
  "NFT_TOKEN_ID",
  "POLYGON_RPC_URL",
  "SENDER_PRIVATE_KEY"
];
const missingEnv = criticalEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error("❌ FATAL: Missing env variables:", missingEnv.join(", "));
  process.exit(1);
}

// --- Security Middleware ---
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", // Set to frontend URL for production
    credentials: true, // Allow cookies for session
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- Session ---
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

// --- Helper: Safe JSON Parse ---
async function safeJsonParse(response) {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (e) {
      throw new Error("Failed to parse Pi API response as JSON.");
    }
  }
  const rawText = await response.text();
  throw new Error(`Expected JSON, got: ${rawText || "<empty>"}`);
}

// --- Routes ---
const paymentRoutes = require("./routes/payment");
app.use("/api", paymentRoutes);

// --- NFT Supply Endpoint ---
const nftSupply = require("./utils/nftSupply");
app.get("/api/nft/supply", (req, res) => {
  const remaining = nftSupply.getRemaining();
  res.json({ remaining, soldOut: remaining <= 0 });
});

// --- Pi Network JWT Verification ---
app.post("/api/verify-user", async (req, res) => {
  const { jwt } = req.body;
  if (!jwt) {
    return res.status(400).json({ success: false, error: "No JWT provided" });
  }

  try {
    const response = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pi API Error:", response.status, errorText);
      return res.status(401).json({ success: false, error: "Invalid Pi JWT", detail: errorText });
    }

    let user;
    try {
      user = await safeJsonParse(response);
    } catch (jsonError) {
      return res.status(500).json({ success: false, error: jsonError.message });
    }

    req.session.user = user; // Persist user in session
    res.json({ success: true, user });

  } catch (error) {
    console.error("JWT Verification Error:", error);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
});

// --- Pi Validation Endpoint ---
app.get("/.well-known/pi-validation", (req, res) => {
  res.send(process.env.PI_VALIDATION_KEY);
});

// --- Homepage ---
app.get("/", (req, res) => {
  res.send(`
    <h1>🚀 Budyz Backend</h1>
    <p>Authenticated: ${req.session.user ? "Yes" : "No"}</p>
    <ul>
      <li><a href="/api/nft/supply">NFT Supply</a></li>
    </ul>
  `);
});

// --- Error Handling for 404 ---
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// --- Error Handling for 500 ---
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err);
  res.status(500).json({ success: false, error: err.message || "Internal server error" });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});