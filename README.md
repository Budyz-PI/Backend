Budyz Backend

This is the backend server for the Budyz project. It handles API requests, authentication, NFT minting supply tracking, and integration with the Pi Network.

Features

Express.js REST API server
User login via Pi Network
Tracks NFT minting supply using a persistent nftSupply.json file
Rate limiting on endpoints
Session management with express-session
Input validation with express-validator
Environment configuration via .env file
CORS configured for cross-origin requests

Requirements

Node.js version 16 or higher
npm

Getting Started

Clone the repository

git clone https://github.com/YOUR_USERNAME/budyz-backend.git
cd budyz-backend

Install dependencies

npm install

Configure environment variables

Create a .env file in the root directory and add the required environment variables. See .env.example if available.

Start the backend server

npm start

The server will start on the port specified in your .env file, or 3000 by default.

File Structure

app.js           main backend entry point
nftSupply.json   persists NFT minted count, auto-updated, ignored by git
.env             environment variables, do not commit
.gitignore       files/folders to ignore in version control
package.json     project dependencies and scripts

Notes

Authentication is via the Pi Network only
NFT minting data is stored in nftSupply.json and should not be committed
If you have issues, check that all environment variables are set and dependencies are installed

License

ISC, see LICENSE file for details