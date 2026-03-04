'use client'

import './globals.css'
import type { Metadata } from 'next'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { Navbar } from '@/components/ui/Navbar'

const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]:        http(),
    [baseSepolia.id]: http(),
  },
})

const queryClient = new QueryClient()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>MemeVault — Daily Gasless Meme Drops on Base</title>
        <meta name="description" content="Mint trending memes as free NFTs every day on Base. Gasless. Forever." />
        <meta property="og:title" content="MemeVault 🐸" />
        <meta property="og:description" content="Daily gasless meme mints on Base" />
        <meta name="theme-color" content="#080B10" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <OnchainKitProvider
              apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
              chain={base}
            >
              <Navbar />
              <main className="pt-14">{children}</main>
            </OnchainKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}
