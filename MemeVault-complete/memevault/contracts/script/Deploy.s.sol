// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MemeVault.sol";

/**
 * @title DeployMemeVault
 * @notice Deployment script for MemeVault on Base / Base Sepolia
 *
 * Usage:
 *   # Testnet (Base Sepolia)
 *   forge script script/Deploy.s.sol:DeployMemeVault \
 *     --rpc-url base_sepolia \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 *
 *   # Mainnet (Base)
 *   forge script script/Deploy.s.sol:DeployMemeVault \
 *     --rpc-url base \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 *
 * Required env vars (.env):
 *   PRIVATE_KEY=0x...
 *   PAYMASTER_ADDRESS=0x...   (Coinbase Paymaster on Base)
 *   BASESCAN_API_KEY=...
 */
contract DeployMemeVault is Script {

    // ── Coinbase Paymaster addresses ──────────────────────────────────────
    // Base Mainnet Paymaster (ERC-4337 EntryPoint v0.6)
    address constant PAYMASTER_BASE         = 0x2FE4D439B42b9F98d33E9c62A6A832F06e9D9041;
    // Base Sepolia Paymaster
    address constant PAYMASTER_BASE_SEPOLIA = 0x2FE4D439B42b9F98d33E9c62A6A832F06e9D9041;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployerAddr = vm.addr(deployerKey);

        // Pick paymaster based on chain
        address paymasterAddr = block.chainid == 8453
            ? PAYMASTER_BASE
            : PAYMASTER_BASE_SEPOLIA;

        console.log("=== MemeVault Deployment ===");
        console.log("Chain ID    :", block.chainid);
        console.log("Deployer    :", deployerAddr);
        console.log("Paymaster   :", paymasterAddr);

        vm.startBroadcast(deployerKey);

        MemeVault vault = new MemeVault(paymasterAddr);

        console.log("Contract    :", address(vault));

        // ── Create Drop #001 — the genesis meme ───────────────────────────
        // Replace with your real IPFS URI before mainnet deploy
        vault.createDrop(
            "ipfs://QmPlaceholder001/metadata.json",
            "gm, ser. This is fine. \xF0\x9F\x94\xA5",
            "memevault.base"
        );

        console.log("Drop #001 created!");
        console.log("===========================");

        vm.stopBroadcast();
    }
}
