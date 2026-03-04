'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { clsx } from 'clsx'
import { submitMeme } from '@/lib/supabase/client'

const TAGS = ['😂 Funny', '💀 Degen', '🐸 Pepe', '🚀 GMI', '🤝 Collab', '💎 Diamond Hands', '🔥 Classic', '🌙 Moonboy']

export default function SubmitPage() {
  const { address, isConnected } = useAccount()
  const [title, setTitle]     = useState('')
  const [note, setNote]       = useState('')
  const [tags, setTags]       = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [status, setStatus]   = useState<'idle' | 'uploading' | 'submitting' | 'done' | 'error'>('idle')
  const [dragOver, setDragOver] = useState(false)

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function handleSubmit() {
    if (!isConnected || !address || !title || !imageUrl) return
    setStatus('submitting')
    const result = await submitMeme({
      wallet: address,
      title,
      image_url: imageUrl,
      metadata_uri: '',
      tags,
      note: note || null,
    })
    setStatus(result ? 'done' : 'error')
  }

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-6xl mb-6">🔒</p>
        <h2 className="text-2xl font-black mb-2">Connect Your Wallet</h2>
        <p className="text-tx-2 text-sm">You need a Base wallet to submit memes.</p>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center animate-fade-up">
        <p className="text-7xl mb-6">🐸</p>
        <h2 className="text-2xl font-black mb-3">Meme Submitted!</h2>
        <p className="text-tx-2 text-sm mb-8">
          Your meme enters the 24hr community vote.<br/>
          Top voted meme becomes tomorrow's drop.
        </p>
        <button
          onClick={() => { setTitle(''); setNote(''); setTags([]); setImageUrl(''); setStatus('idle') }}
          className="px-6 py-3 bg-accent/10 border border-accent/30 text-accent
                     rounded-btn font-bold text-sm font-mono hover:bg-accent/20 transition-colors"
        >
          Submit Another
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 animate-fade-up">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4
                        bg-accent2/10 border border-accent2/25 font-mono text-[11px]
                        font-bold text-accent2 uppercase tracking-widest">
          ✍️ Community Submissions
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-2">Submit a Meme</h1>
        <p className="text-tx-2 text-sm">Top voted meme becomes tomorrow's drop. Make it funny.</p>
      </div>

      {/* Form */}
      <div className="bg-surface border border-border2 rounded-panel p-8 space-y-6">

        {/* Upload zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault(); setDragOver(false)
            // In production: upload to IPFS via NFT.Storage
            setImageUrl('https://placeholder.com/meme.jpg')
          }}
          className={clsx(
            'border-2 border-dashed rounded-card p-12 text-center cursor-pointer transition-all',
            dragOver
              ? 'border-accent bg-accent/4'
              : 'border-border2 bg-surface2 hover:border-accent hover:bg-accent/4'
          )}
        >
          <p className="text-5xl mb-3">🖼️</p>
          <p className="font-bold text-sm mb-1">
            {imageUrl ? '✅ Image ready' : 'Drop your meme here'}
          </p>
          <p className="text-xs text-tx-3 font-mono">PNG, JPG, GIF up to 10MB · Uploads to IPFS</p>
        </div>

        {/* Title */}
        <div>
          <label className="block font-mono text-[11px] font-bold text-tx-2 uppercase tracking-widest mb-2">
            Meme Title *
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. When the gas is $0.00001"
            maxLength={80}
            className="w-full px-4 py-3 bg-surface2 border border-border2 rounded-card
                       text-sm font-display text-tx outline-none transition-colors
                       focus:border-accent placeholder:text-tx-3"
          />
          <p className="text-right font-mono text-[10px] text-tx-3 mt-1">{title.length}/80</p>
        </div>

        {/* Tags */}
        <div>
          <label className="block font-mono text-[11px] font-bold text-tx-2 uppercase tracking-widest mb-3">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={clsx(
                  'px-4 py-1.5 rounded-full text-xs font-bold border transition-all',
                  tags.includes(tag)
                    ? 'border-accent2/60 text-accent2 bg-accent2/10'
                    : 'border-border2 text-tx-2 bg-surface2 hover:border-accent2/40 hover:text-accent2'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block font-mono text-[11px] font-bold text-tx-2 uppercase tracking-widest mb-2">
            Why this meme? <span className="text-tx-3 normal-case">(optional)</span>
          </label>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Convince the community (max 120 chars)"
            maxLength={120}
            className="w-full px-4 py-3 bg-surface2 border border-border2 rounded-card
                       text-sm font-display text-tx outline-none transition-colors
                       focus:border-accent placeholder:text-tx-3"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!title || !imageUrl || status === 'submitting'}
          className={clsx(
            'w-full py-4 rounded-panel font-black text-base font-display transition-all',
            (!title || !imageUrl)
              ? 'bg-surface2 text-tx-3 cursor-not-allowed'
              : status === 'submitting'
              ? 'bg-accent2 text-white cursor-wait'
              : 'bg-gradient-to-r from-accent2 to-accent text-bg hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(123,97,255,0.4)]'
          )}
        >
          {status === 'submitting' ? '⏳ Submitting…' : '🚀 Submit to Community Vote'}
        </button>

        <p className="text-center text-xs text-tx-3 font-mono leading-relaxed">
          Must hold a Base wallet to submit.<br/>
          Your submission enters the 24hr community vote.
        </p>
      </div>
    </div>
  )
}
