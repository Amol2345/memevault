'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet'
import { Avatar, Name, Address } from '@coinbase/onchainkit/identity'
import { clsx } from 'clsx'

const NAV_LINKS = [
  { href: '/',            label: "Today's Drop", emoji: '🔥' },
  { href: '/leaderboard', label: 'Leaderboard',  emoji: '🏆' },
  { href: '/submit',      label: 'Submit Meme',  emoji: '✍️' },
  { href: '/collection',  label: 'My Collection', emoji: '🎨' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6 gap-4
                    bg-bg/90 backdrop-blur-xl border-b border-border">

      {/* Logo */}
      <Link href="/" className="font-mono font-bold text-accent text-sm mr-4
                                 flex items-center gap-2 hover:opacity-80 transition-opacity">
        🐸 <span>MemeVault<span className="text-accent3">.</span></span>
      </Link>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-1 flex-1">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-bold tracking-wide transition-all',
              pathname === href
                ? 'text-accent bg-accent/10 border border-accent/20'
                : 'text-tx-3 hover:text-tx-2 hover:bg-surface'
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Wallet */}
      <div className="ml-auto">
        <Wallet>
          <ConnectWallet className="!bg-accent/10 !border !border-accent/30 !text-accent
                                    !font-bold !text-xs !rounded-lg !px-4 !py-2
                                    hover:!bg-accent/20 hover:!border-accent transition-all font-mono">
            <Avatar className="w-4 h-4" />
            <Name className="text-accent font-mono text-xs font-bold" />
          </ConnectWallet>
          <WalletDropdown className="!bg-surface !border !border-border2 !rounded-panel">
            <div className="px-4 py-3 border-b border-border">
              <Address className="text-tx-2 font-mono text-xs" />
            </div>
            <WalletDropdownDisconnect className="!text-red !text-sm !font-bold hover:!bg-red/10 transition-colors" />
          </WalletDropdown>
        </Wallet>
      </div>
    </nav>
  )
}

