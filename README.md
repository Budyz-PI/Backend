# Budyz Backend

This is the backend server for the **Budyz** project. The backend is responsible for handling API requests, authentication, NFT minting supply tracking, and integration with the Pi Network.

---

## Features

- **Express.js Server**: RESTful API built with Express.
- **Pi Network Authentication**: Handles user login via Pi Network.
- **NFT Minting Supply**: Tracks minted NFTs using a persistent `nftSupply.json` file.
- **Rate Limiting**: Protects endpoints using `express-rate-limit`.
- **Session Management**: Uses `express-session` for user session handling.
- **Validation**: Input validation via `express-validator`.
- **Environment Configuration**: Supports `.env` for API keys and secrets.
- **CORS**: Configured for secure cross-origin requests.

---

## Requirements

- Node.js (v16 or above recommended)
- npm

---

## Getting Started

1. **Clone the repository**

   ```sh
   git clone https://github.com/YOUR_USERNAME/budyz-backend.git
   cd budyz-backend
   ```

2. **Install dependencies**

   ```sh
   npm install
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the root directory and add the necessary environment variables (see `.env.example` if available).

4. **Start the backend server**

   ```sh
   npm start
   ```

   The server will start on the port specified in your `.env` (default: 3000).

---

## File Structure

- `app.js` — Main entry point of the backend server.
- `nftSupply.json` — Persists the NFT minted count (automatically updated; ignored by git).
- `.env` — Store sensitive environment variables (never commit this file).
- `.gitignore` — Ensures sensitive/runtime data are not committed.
- `package.json` — Project dependencies and scripts.

---

## Notes

- Authentication is handled exclusively via the Pi Network.
- NFT minting data is stored in `nftSupply.json` and **should not be committed to the repository**.
- If you encounter issues, ensure all environment variables are set correctly and dependencies are installed.

---

## License

[ISC](LICENSE)