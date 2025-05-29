# Meteora Bundler

A backend service for Meteora DLmm (Distributed Liquidity Market Maker) on Solana, built with Express.js and TypeScript. This bundler service facilitates interactions with Meteora's liquidity pools and manages transaction bundling.
If you need my help, plz contact to [me](https://t.me/Ee1030109)

## Transaction

### Meteora-dlmm
https://explorer.jito.wtf/bundle/ab1513898266ae74fa3d6c0e56a6568cf3d558aad99067c1b60139eee41f7b31
https://explorer.jito.wtf/bundle/9b33da9c377f2ae7e4f777a1c9ab266dfd5fd3b31f46e6c55211f1b62b23214c

## Features

- Integration with Meteora DLmm using `@meteora-ag/dlmm`
- Transaction bundling for Meteora operations
- Solana blockchain integration using `@solana/web3.js`
- SPL Token operations support
- RESTful API endpoints for liquidity pool interactions
- TypeScript for enhanced type safety and developer experience
- Request logging with Morgan
- Environment variable configuration support

## Prerequisites

- Node.js (v14 or higher)
- Yarn package manager
- Solana CLI tools
- Access to a Solana RPC endpoint

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd meteora-bundler
```

2. Install dependencies:
```bash
yarn install
```

3. Create a `.env` file in the root directory and add your environment variables:
```env
PORT=3000
SOLANA_RPC_URL=your_solana_rpc_url
# Add any other required Meteora-specific configuration
```

## Development

To start the development server with hot-reload:

```bash
yarn dev
```

The server will start on the configured port (default: 3000).

## Project Structure

- `index.ts` - Application entry point and server setup
- `config.ts` - Configuration and environment settings
- `controller/` - Meteora operation handlers and bundling logic
- `route/` - API endpoint definitions
- `middleware/` - Express middleware functions
- `lib/` - Utility functions and Meteora helpers

## Dependencies

Key dependencies include:
- `@meteora-ag/dlmm` (v1.4.11) - Meteora DLmm SDK
- `@solana/web3.js` (v1.98.0) - Solana web3 library
- `@solana/spl-token` (v0.4.8) - SPL Token support
- `express` (v4.21.0) - Web framework
- `typescript` (v5.6.2) - TypeScript support

For a complete list of dependencies, see `package.json`.

## License

ISC

## Author

[Your Name/Organization]

---

For more information about Meteora or support with this bundler, please open an issue in the repository. 