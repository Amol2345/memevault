# MemeVault Smart Contract

> ERC-1155 daily meme drops on Base. Gasless via Coinbase Paymaster.

## Overview

Each daily meme drop = 1 ERC-1155 token ID with unlimited supply.
Users mint for free — gas is sponsored by Coinbase Paymaster (ERC-4337).

```
Drop #001 → Token ID 1 → Unlimited mints → All gasless
Drop #002 → Token ID 2 → Unlimited mints → All gasless
...
```

## Setup

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Clone and install deps
forge install OpenZeppelin/openzeppelin-contracts

# Copy env
cp .env.example .env
# Fill in PRIVATE_KEY, PAYMASTER_ADDRESS, BASESCAN_API_KEY
```

## Test

```bash
# Run all tests
forge test -vv

# Run with gas report
forge test --gas-report

# Run fuzz tests (1000 runs)
forge test --fuzz-runs 1000

# Run specific test
forge test --match-test test_mint_success -vvvv
```

## Deploy

```bash
# Base Sepolia (testnet)
forge script script/Deploy.s.sol:DeployMemeVault \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  -vvvv

# Base Mainnet
forge script script/Deploy.s.sol:DeployMemeVault \
  --rpc-url base \
  --broadcast \
  --verify \
  -vvvv
```

## Key Functions

| Function | Who | Description |
|----------|-----|-------------|
| `createDrop(uri, title, submittedBy)` | Owner | Create a new daily drop |
| `mint(tokenId)` | Anyone | Gasless mint via Paymaster |
| `mintBatch(tokenIds[])` | Anyone | Mint multiple past drops |
| `deactivateDrop(tokenId)` | Owner | Emergency takedown |
| `pause()` / `unpause()` | Owner | Emergency stop all mints |
| `getDrop(tokenId)` | Anyone | Read drop metadata |
| `getCurrentDrop()` | Anyone | Get today's active drop |
| `hasMintedDrop(tokenId, wallet)` | Anyone | Check if wallet minted |

## Contract Addresses

| Network | Address |
|---------|---------|
| Base Sepolia | TBD after testnet deploy |
| Base Mainnet | TBD after mainnet deploy |

## Security

- `ReentrancyGuard` on all mint functions
- `Pausable` for emergency stop
- `Ownable` for admin functions
- 1 mint per wallet per drop (configurable)
- Slither static analysis recommended before mainnet

## Gas Estimates (approximate)

| Function | Gas |
|----------|-----|
| `createDrop` | ~85,000 |
| `mint` | ~75,000 |
| `mintBatch (3 drops)` | ~140,000 |

With Coinbase Paymaster — all mint gas is $0 for users.
