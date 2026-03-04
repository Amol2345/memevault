'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { getLeaderboard, type LeaderboardEntry } from '@/lib/supabase/client'

type Period = 'all' | 'week' | 'today'

const RANK_STYLES: Record<number, { medal: string; color: string; border: string; bar: string }> = {
  1: { medal: '🥇', color: 'text-yellow', border: 'border-yellow/40', bar: 'bg-yellow' },
  2: { medal: '🥈', color: 'text-[#C0C0C0]', border: 'border-[#C0C0C0]/30', bar: 'bg-[#C0C0C0]' },
  3: { medal: '🥉', color: 'text-[#CD7F32]', border: 'border-[#CD7F32]/30', bar: 'bg-[#CD7F32]' },
}

const BADGES = [
  { min: 200, label: 'OG',    style: 'bg-yellow/10 text-yellow border-yellow/25' },
  { min: 100, label: 'DEGEN', style: 'bg-accent2/10 text-accent2 border-accent2/25' },
  { min: 50,  label: 'WHALE', style: 'bg-accent/10 text-accent border-accent/25' },
]

function getBadge(mints: number) {
  return BADGES.find(b => mints >= b.min)
}

// Mock data (replace with real Supabase query)
const MOCK_LEADERS: LeaderboardEntry[] = [
  { wallet: 'kingmeme.eth',     total_mints: 247, rank: 1, streak: 47 },
  { wallet: 'pepenomics.base',  total_mints: 198, rank: 2, streak: 38 },
  { wallet: 'sharkwifhat.eth',  total_mints: 176, rank: 3, streak: 22 },
  { wallet: 'robotgmi.base',    total_mints: 154, rank: 4, streak: 15 },
  { wallet: 'moonboi.eth',      total_mints: 132, rank: 5, streak: 12 },
  { wallet: 'wagmisage.base',   total_mints: 118, rank: 6, streak: 9  },
  { wallet: 'based4ever.eth',   total_mints: 97,  rank: 7, streak: 7  },
  { wallet: 'degen4life.base',  total_mints: 84,  rank: 8, streak: 5  },
]

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('all')
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>(MOCK_LEADERS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getLeaderboard(period)
      .then(data => { if (data.length) setLeaders(data) })
      .finally(() => setLoading(false))
  }, [period])

  const maxMints = leaders[0]?.total_mints ?? 1

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 animate-fade-up">

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4
                        bg-yellow/10 border border-yellow/25 font-mono text-[11px]
                        font-bold text-yellow uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow animate-pulse" />
          All-Time Rankings
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-2">🏆 Leaderboard</h1>
        <p className="text-tx-2 text-sm">Top minters on MemeVault. Bragging rights, forever onchain.</p>
      </div>

      {/* Period filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'week', 'today'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-bold border transition-all capitalize',
              period === p
                ? 'border-accent/60 text-accent bg-accent/10'
                : 'border-border2 text-tx-2 hover:border-accent/40 hover:text-accent'
            )}
          >
            {p === 'all' ? 'All Time' : p === 'week' ? 'This Week' : 'Today'}
          </button>
        ))}
      </div>

      {/* Leaderboard rows */}
      <div className="flex flex-col gap-3">
        {leaders.map((entry, i) => {
          const rankStyle = RANK_STYLES[entry.rank]
          const badge     = getBadge(entry.total_mints)
          const barWidth  = Math.round((entry.total_mints / maxMints) * 100)

          return (
            <div
              key={entry.wallet}
              className={clsx(
                'bg-surface border rounded-panel px-5 py-4 transition-all',
                'hover:translate-x-1 relative overflow-hidden',
                rankStyle ? rankStyle.border : 'border-border',
              )}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {/* Gold left bar */}
              {entry.rank === 1 && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow shadow-[0_0_8px_#FFD600]" />
              )}

              <div className="flex items-center gap-4">

                {/* Rank */}
                <div className={clsx('font-mono text-lg font-bold w-8 text-center flex-shrink-0',
                  rankStyle ? rankStyle.color : 'text-tx-3')}>
                  {rankStyle ? rankStyle.medal : entry.rank}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm truncate">{entry.wallet}</span>
                    {badge && (
                      <span className={clsx('px-2 py-0.5 rounded text-[10px] font-bold border font-mono flex-shrink-0', badge.style)}>
                        {badge.label}
                      </span>
                    )}
                    {entry.streak >= 7 && (
                      <span className="text-[10px] font-mono text-accent3">🔥{entry.streak}d</span>
                    )}
                  </div>
                  {/* Mini progress bar */}
                  <div className="h-1 bg-surface2 rounded-full overflow-hidden w-full">
                    <div
                      className={clsx('h-full rounded-full transition-all', rankStyle?.bar ?? 'bg-accent')}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* Mint count */}
                <div className="text-right flex-shrink-0">
                  <p className={clsx('font-mono text-xl font-bold',
                    rankStyle ? rankStyle.color : 'text-accent')}>
                    {entry.total_mints.toLocaleString()}
                  </p>
                  <p className="font-mono text-[10px] text-tx-3 uppercase tracking-wider">Mints</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {loading && (
        <div className="text-center py-8 font-mono text-xs text-tx-3 animate-pulse">
          Loading rankings…
        </div>
      )}
    </div>
  )
}
