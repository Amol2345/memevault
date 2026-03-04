import { base, baseSepolia } from 'wagmi/chains'

// ── Replace after deploy ────────────────────────────────────────────────────
export const CONTRACT_ADDRESSES: Record<number, `0x${string}`> = {
  [base.id]:        '0x0000000000000000000000000000000000000000', // TODO: mainnet
  [baseSepolia.id]: '0x0000000000000000000000000000000000000000', // TODO: testnet
}

export const MEMEVAULT_ABI = [
  // Read
  {
    name: 'currentDropId', type: 'function', stateMutability: 'view',
    inputs: [], outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getCurrentDrop', type: 'function', stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'tokenId', type: 'uint256' },
      {
        name: 'drop', type: 'tuple',
        components: [
          { name: 'metadataURI', type: 'string' },
          { name: 'title',       type: 'string' },
          { name: 'submittedBy', type: 'string' },
          { name: 'mintedAt',    type: 'uint256' },
          { name: 'totalMints',  type: 'uint256' },
          { name: 'active',      type: 'bool' },
        ],
      },
    ],
  },
  {
    name: 'getDrop', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{
      name: '', type: 'tuple',
      components: [
        { name: 'metadataURI', type: 'string' },
        { name: 'title',       type: 'string' },
        { name: 'submittedBy', type: 'string' },
        { name: 'mintedAt',    type: 'uint256' },
        { name: 'totalMints',  type: 'uint256' },
        { name: 'active',      type: 'bool' },
      ],
    }],
  },
  {
    name: 'hasMintedDrop', type: 'function', stateMutability: 'view',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'wallet',  type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getTotalMints', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [
      { name: 'account',  type: 'address' },
      { name: 'tokenId',  type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Write
  {
    name: 'mint', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'mintBatch', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenIds', type: 'uint256[]' }],
    outputs: [],
  },
  // Events
  {
    name: 'MemeMinted', type: 'event',
    inputs: [
      { name: 'tokenId',    type: 'uint256', indexed: true },
      { name: 'minter',     type: 'address', indexed: true },
      { name: 'totalMints', type: 'uint256', indexed: false },
    ],
  },
] as const
