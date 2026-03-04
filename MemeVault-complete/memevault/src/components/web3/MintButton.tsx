'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { clsx } from 'clsx'
import { MEMEVAULT_ABI, CONTRACT_ADDRESSES } from '@/lib/contract/config'
import { recordMintEvent } from '@/lib/supabase/client'

type Props = {
  tokenId: bigint
  onSuccess?: (txHash: string) => void
}

type MintState = 'idle' | 'confirm' | 'pending' | 'success' | 'error' | 'already-minted'

export function MintButton({ tokenId, onSuccess }: Props) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const contractAddress = CONTRACT_ADDRESSES[chainId]

  const [mintState, setMintState] = useState<MintState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const { writeContract, data: txHash, error: writeError, isPending: isWritePending } = useWriteContract()

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Track tx state
  useEffect(() => {
    if (isWritePending) setMintState('confirm')
    if (isTxLoading)   setMintState('pending')
    if (isTxSuccess && txHash) {
      setMintState('success')
      recordMintEvent(Number(tokenId), address!, txHash)
      onSuccess?.(txHash)
    }
    if (writeError) {
      setMintState('error')
      setErrorMsg(writeError.message.includes('AlreadyMintedToday')
        ? 'Already minted today!'
        : 'Transaction failed. Try again.')
    }
  }, [isWritePending, isTxLoading, isTxSuccess, writeError, txHash])

  function handleMint() {
    if (!isConnected || !contractAddress) return
    setMintState('idle')
    writeContract({
      address: contractAddress,
      abi: MEMEVAULT_ABI,
      functionName: 'mint',
      args: [tokenId],
    })
  }

  // ── Render states ──────────────────────────────────────────────────────────

  if (!isConnected) {
    return (
      <div className="w-full py-4 rounded-panel bg-surface2 border border-border
                      text-center text-tx-3 font-mono text-sm">
        Connect wallet to mint
      </div>
    )
  }

  if (mintState === 'success') {
    return (
      <div className="flex flex-col gap-2">
        <button className="w-full py-4 rounded-panel bg-green text-bg font-display
                           font-black text-base flex items-center justify-center gap-2
                           glow-green">
          ✅ Minted! Check Collection
        </button>
        <p className="text-center text-xs text-tx-3 font-mono">
          <a href={`https://basescan.org/tx/${txHash}`} target="_blank"
             rel="noopener noreferrer" className="text-accent hover:underline">
            View on Basescan ↗
          </a>
        </p>
      </div>
    )
  }

  if (mintState === 'error') {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={handleMint}
          className="w-full py-4 rounded-panel bg-red/15 border border-red/30
                     text-red font-display font-black text-base"
        >
          {errorMsg}
        </button>
        <p className="text-center text-xs text-tx-3 font-mono">Click to retry</p>
      </div>
    )
  }

  const isLoading = mintState === 'confirm' || mintState === 'pending'

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleMint}
        disabled={isLoading}
        className={clsx(
          'w-full py-4 rounded-panel font-display font-black text-base',
          'flex items-center justify-center gap-2 transition-all relative overflow-hidden',
          isLoading
            ? 'bg-accent2 text-white cursor-wait'
            : 'bg-accent text-bg hover:-translate-y-0.5 glow-accent'
        )}
      >
        {/* Shimmer on loading */}
        {isLoading && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent
                           via-white/10 to-transparent animate-pulse" />
        )}

        {mintState === 'confirm' && <><span className="animate-spin">⏳</span> Confirm in wallet…</>}
        {mintState === 'pending' && <><span className="animate-pulse">⛽</span> Minting on Base…</>}
        {mintState === 'idle'    && <>⚡ Mint for Free</>}
      </button>

      <p className="text-center text-xs text-tx-3 font-mono">
        {isLoading ? 'Gas is sponsored by Paymaster' : 'No gas. No cost. Just vibes.'}
      </p>
    </div>
  )
}
