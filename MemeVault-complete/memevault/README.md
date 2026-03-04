# 🐸 MemeVault

> Daily gasless meme drops on Base. Free to mint. Forever onchain.

## Project Structure

```
memevault/
├── contracts/          ← Solidity (Foundry)
│   ├── src/MemeVault.sol
│   ├── test/MemeVaultTest.t.sol
│   ├── script/Deploy.s.sol
│   └── foundry.toml
├── src/                ← Next.js frontend
│   ├── app/            ← Pages
│   ├── components/     ← UI + Web3 components
│   └── lib/            ← Supabase + contract utils
├── .env.example        ← Copy to .env.local and fill in
├── vercel.json         ← Cron job config
└── package.json
```

## Quick Start

```bash
# 1. Install deps
npm install

# 2. Copy env
cp .env.example .env.local
# Fill in all values

# 3. Run locally
npm run dev
```

## Deploy

See: DEPLOY.sh for full deployment guide
Or open: memevault-deploy-guide.html (interactive checklist)

## Stack
- Next.js 14 + Tailwind CSS
- wagmi + OnchainKit (wallet connect)
- Supabase (database)
- ERC-1155 on Base (smart contract)
- Coinbase Paymaster (gasless mints)
- Vercel (hosting + cron jobs)
