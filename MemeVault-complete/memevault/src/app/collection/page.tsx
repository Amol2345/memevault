'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { clsx } from 'clsx'
import { getWalletCollection } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

const EMOJI_MAP: Record<number, string> = {
  1: '🐕', 2: '🙈', 3: '🤌', 4: '💀', 5: '🦍',
  6: '📈', 7: '🌕', 8: '🦊', 9: '🐻', 10: '🚀',
}

export default function CollectionPage() {
  const { address, isConnected } = useAccount()
  const [mints, setMints]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!address) { setLoading(false); return }
    getWalletCollection(address)
      .then(data => setMints(data))
      .finally(() => setLoading(false))
  }, [address])

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-6xl mb-6">🎨</p>
        <h2 className="text-2xl font-black mb-2">Your Meme Collection</h2>
        <p className="text-tx-2 text-sm">Connect your wallet to view your minted memes.</p>
      </div>
    )
  }

  const totalMints  = mints.length
  const streak      = 12 // TODO: calculate from mint_events
  const rank        = 23 // TODO: query from leaderboard_view

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-up">

      {/* Profile hero */}
      <div className="bg-surface border border-border2 rounded-panel p-7 mb-8
                      relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full
                        bg-[radial-gradient(circle,rgba(123,97,255,0.1),transparent_70%)]" />

        <div className="flex items-center gap-6 relative z-10">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent2 to-accent
                          flex items-center justify-center text-3xl flex-shrink-0">
            🦊
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-black mb-1">{address?.slice(0,6)}…{address?.slice(-4)}</h2>
            <p className="font-mono text-xs text-tx-3 mb-4">{address}</p>

            {/* Stats */}
            <div className="flex gap-8">
              {[
                { val: totalMints,          label: 'Memes',     color: 'text-accent'  },
                { val: `${streak} 🔥`,      label: 'Day Streak', color: 'text-accent3' },
                { val: `#${rank}`,          label: 'Rank',       color: 'text-yellow'  },
              ].map(({ val, label, color }) => (
                <div key={label}>
                  <p className={clsx('font-mono text-2xl font-bold leading-none mb-0.5', color)}>
                    {val}
                  </p>
                  <p className="font-mono text-[10px] text-tx-3 uppercase tracking-widest">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Collection header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-mono text-xs font-bold text-tx-3 uppercase tracking-widest">
          // Collection ({totalMints} NFTs)
        </h3>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-card overflow-hidden animate-pulse">
              <div className="aspect-square bg-surface2" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-surface2 rounded w-3/4" />
                <div className="h-2 bg-surface2 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && mints.length === 0 && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🐸</p>
          <p className="font-bold text-lg mb-2">No memes yet!</p>
          <p className="text-tx-2 text-sm mb-6">Go mint today's drop to start your collection.</p>
          <a href="/" className="px-6 py-3 bg-accent text-bg rounded-btn font-bold text-sm
                                  hover:-translate-y-0.5 transition-transform inline-block">
            ⚡ Mint Today's Drop
          </a>
        </div>
      )}

      {/* NFT Grid — use mock data if Supabase empty */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {(mints.length ? mints : MOCK_NFTS).map((item, i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-card overflow-hidden
                         cursor-pointer transition-all hover:-translate-y-1
                         hover:border-accent/30 hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)]"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="aspect-square bg-surface2 flex items-center justify-center
                              text-6xl relative">
                {EMOJI_MAP[item.token_id ?? (i % 10) + 1] ?? '🐸'}
                <span className="absolute top-2 left-2 bg-bg/80 text-accent font-mono
                                 text-[10px] font-bold px-2 py-0.5 rounded border border-accent/20">
                  #{String(item.token_id ?? i + 1).padStart(3, '0')}
                </span>
              </div>
              <div className="p-3">
                <p className="text-xs font-bold truncate mb-1">
                  {item.drops?.title ?? MOCK_NFTS[i % MOCK_NFTS.length].title}
                </p>
                <p className="font-mono text-[10px] text-tx-3">
                  {item.created_at
                    ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true })
                    : MOCK_NFTS[i % MOCK_NFTS.length].date}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Mock NFTs for UI preview
const MOCK_NFTS = [
  { token_id: 1, title: 'This is fine. 🔥',     date: 'Today' },
  { token_id: 2, title: 'WAGMI or NGMI?',        date: 'Yesterday' },
  { token_id: 3, title: 'Wen moon ser',           date: '2 days ago' },
  { token_id: 4, title: 'Rekt but gm',            date: '3 days ago' },
  { token_id: 5, title: 'Ape together strong',    date: '5 days ago' },
  { token_id: 6, title: 'Number go up',           date: '1 week ago' },
]
