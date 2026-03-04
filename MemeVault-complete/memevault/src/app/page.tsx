'use client'

import { useEffect, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { useChainId } from 'wagmi'
import { formatDistanceToNow } from 'date-fns'
import { MintButton } from '@/components/web3/MintButton'
import { MEMEVAULT_ABI, CONTRACT_ADDRESSES } from '@/lib/contract/config'
import { getTodaysDrop, type Drop } from '@/lib/supabase/client'
import { clsx } from 'clsx'

// ── Countdown to next drop (midnight UTC) ────────────────────────────────────
function useCountdown() {
  const [time, setTime] = useState({ h: '00', m: '00', s: '00' })
  useEffect(() => {
    const tick = () => {
      const now     = new Date()
      const midnight = new Date(); midnight.setUTCHours(24,0,0,0)
      const diff    = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000))
      setTime({
        h: String(Math.floor(diff / 3600)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600) / 60)).padStart(2, '0'),
        s: String(diff % 60).padStart(2, '0'),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

// ── Recent minters mock (replace with Supabase realtime sub) ─────────────────
const MOCK_MINTERS = [
  { emoji: '🦊', name: 'degen.eth',      time: 'just now' },
  { emoji: '🐻', name: 'bearmode.base',  time: '12s ago'  },
  { emoji: '🚀', name: 'pumping.eth',    time: '45s ago'  },
  { emoji: '🌊', name: 'wavegmi.base',   time: '1m ago'   },
]

export default function DropPage() {
  const [drop, setDrop] = useState<Drop | null>(null)
  const [mintCount, setMintCount] = useState(0)
  const countdown = useCountdown()
  const { address } = useAccount()
  const chainId = useChainId()

  // Load today's drop from Supabase
  useEffect(() => {
    getTodaysDrop().then(d => { if (d) setDrop(d) })
  }, [])

  // Read on-chain mint count
  const { data: onchainMints } = useReadContract({
    address: CONTRACT_ADDRESSES[chainId],
    abi:     MEMEVAULT_ABI,
    functionName: 'getTotalMints',
    args:    drop ? [BigInt(drop.id)] : undefined,
  })

  useEffect(() => {
    if (onchainMints) setMintCount(Number(onchainMints))
  }, [onchainMints])

  // Check if already minted
  const { data: alreadyMinted } = useReadContract({
    address:      CONTRACT_ADDRESSES[chainId],
    abi:          MEMEVAULT_ABI,
    functionName: 'hasMintedDrop',
    args:         drop && address ? [BigInt(drop.id), address] : undefined,
  })

  if (!drop) return <PageSkeleton />

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

      {/* ── LEFT: Meme card ── */}
      <div className="animate-fade-up">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5
                        bg-accent3/10 border border-accent3/30 font-mono text-[11px]
                        font-bold text-accent3 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-accent3 shadow-[0_0_6px_#FF6B35] animate-pulse" />
          Drop #{String(drop.id).padStart(3,'0')} — Today
        </div>

        <h1 className="text-4xl font-black tracking-tight mb-2 font-display">
          {drop.title}
        </h1>
        <p className="text-tx-2 text-sm mb-7 font-display">
          Community voted · Gasless · Yours forever on Base
        </p>

        {/* Meme image card */}
        <div className="bg-surface border border-border2 rounded-panel overflow-hidden
                        hover:border-accent/30 transition-colors group">
          <div className="aspect-square bg-surface2 flex items-center justify-center
                          text-9xl relative overflow-hidden">
            {/* Gradient atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(0,229,255,0.06),transparent_60%),radial-gradient(ellipse_at_70%_70%,rgba(123,97,255,0.06),transparent_60%)]" />
            {/* Replace with <Image> from IPFS in production */}
            <span className="relative z-10">🐕</span>
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-16
                            bg-gradient-to-t from-bg/90 to-transparent
                            font-mono font-bold text-xl text-center tracking-tight">
              "gm, ser. This is fine."
            </div>
          </div>

          {/* Meta bar */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-border">
            <div>
              <p className="font-mono text-[10px] text-tx-3 uppercase tracking-widest mb-0.5">Total Mints</p>
              <p className="font-mono text-xl font-bold text-accent">
                {mintCount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-tx-3 uppercase tracking-widest mb-0.5">Submitted by</p>
              <p className="text-sm font-bold text-accent2">{drop.submitted_by}</p>
            </div>
            <div className="font-mono text-xs text-tx-3 bg-surface2 px-3 py-1.5
                            rounded-md border border-border">
              Token #{String(drop.id).padStart(3,'0')}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Mint panel ── */}
      <div className="flex flex-col gap-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>

        {/* Mint panel */}
        <div className="bg-surface border border-border2 rounded-panel p-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full
                          bg-[radial-gradient(circle,rgba(0,229,255,0.07),transparent_70%)]" />

          <p className="font-mono text-[11px] font-bold text-tx-2 uppercase tracking-widest mb-5">
            // Mint Now
          </p>

          {/* Gasless badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5
                          bg-green/10 border border-green/25 font-mono text-xs font-bold text-green">
            ⛽ 100% Gasless — Paymaster Sponsored
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { val: mintCount.toLocaleString(), label: 'Minted', color: 'text-accent' },
              { val: '∞',                        label: 'Supply',  color: 'text-yellow' },
            ].map(({ val, label, color }) => (
              <div key={label} className="bg-surface2 border border-border rounded-card p-3 text-center">
                <p className={clsx('font-mono text-3xl font-bold leading-none mb-1', color)}>{val}</p>
                <p className="font-mono text-[10px] text-tx-3 uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>

          {/* Hype bar */}
          <div className="mb-6">
            <div className="flex justify-between font-mono text-xs text-tx-2 mb-2">
              <span>Community hype</span>
              <span>🔥 62%</span>
            </div>
            <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
              <div className="h-full w-[62%] rounded-full animate-shimmer
                              bg-gradient-to-r from-accent2 to-accent" />
            </div>
          </div>

          <MintButton
            tokenId={BigInt(drop.id)}
            onSuccess={(txHash) => {
              setMintCount(c => c + 1)
              console.log('Minted! tx:', txHash)
            }}
          />
        </div>

        {/* Countdown */}
        <div className="bg-surface border border-border rounded-card px-5 py-4
                        flex items-center gap-3">
          <span className="font-mono text-xs text-tx-3 whitespace-nowrap">Next drop in</span>
          <div className="flex gap-1.5 font-mono text-xl font-bold text-accent">
            <span>{countdown.h}</span>
            <span className="text-tx-3">:</span>
            <span>{countdown.m}</span>
            <span className="text-tx-3">:</span>
            <span>{countdown.s}</span>
          </div>
        </div>

        {/* Recent minters */}
        <div className="bg-surface border border-border rounded-card p-5">
          <p className="font-mono text-[10px] font-bold text-tx-3 uppercase tracking-widest mb-3">
            // Recent Minters
          </p>
          {MOCK_MINTERS.map((m, i) => (
            <div key={i} className={clsx('flex items-center gap-3 py-2',
              i < MOCK_MINTERS.length - 1 && 'border-b border-border')}>
              <span className="text-lg">{m.emoji}</span>
              <span className="text-sm font-bold flex-1">{m.name}</span>
              <span className="font-mono text-xs text-tx-3">{m.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 animate-pulse">
      <div className="space-y-4">
        <div className="h-5 w-36 bg-surface2 rounded-full" />
        <div className="h-10 w-64 bg-surface2 rounded-lg" />
        <div className="aspect-square bg-surface2 rounded-panel" />
      </div>
      <div className="space-y-4">
        <div className="h-64 bg-surface2 rounded-panel" />
        <div className="h-16 bg-surface2 rounded-card" />
        <div className="h-32 bg-surface2 rounded-card" />
      </div>
    </div>
  )
}
