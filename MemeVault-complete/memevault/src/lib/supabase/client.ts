import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Database types (auto-gen with: supabase gen types typescript) ───────────

export type Drop = {
  id:           number          // token_id from contract
  title:        string
  metadata_uri: string          // ipfs://...
  submitted_by: string          // ENS / address
  image_url:    string          // cached image from IPFS
  tags:         string[]
  vote_count:   number
  is_active:    boolean
  drop_date:    string          // ISO date string (one drop per day)
  created_at:   string
}

export type Submission = {
  id:           string          // uuid
  wallet:       string          // submitter's wallet address
  title:        string
  image_url:    string          // IPFS URL
  metadata_uri: string
  tags:         string[]
  note:         string | null
  vote_count:   number
  status:       'pending' | 'approved' | 'rejected' | 'scheduled'
  created_at:   string
}

export type Vote = {
  id:            string
  wallet:        string
  submission_id: string
  created_at:    string
}

export type MintEvent = {
  id:         string
  token_id:   number
  wallet:     string
  tx_hash:    string
  created_at: string
}

export type LeaderboardEntry = {
  wallet:      string
  total_mints: number
  rank:        number
  streak:      number
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getTodaysDrop(): Promise<Drop | null> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('drops')
    .select('*')
    .eq('drop_date', today)
    .eq('is_active', true)
    .single()
  return data
}

export async function getDropById(id: number): Promise<Drop | null> {
  const { data } = await supabase
    .from('drops')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

export async function getDropArchive(): Promise<Drop[]> {
  const { data } = await supabase
    .from('drops')
    .select('*')
    .eq('is_active', true)
    .order('drop_date', { ascending: false })
    .limit(50)
  return data ?? []
}

export async function getPendingSubmissions(): Promise<Submission[]> {
  const { data } = await supabase
    .from('submissions')
    .select('*')
    .eq('status', 'pending')
    .order('vote_count', { ascending: false })
    .limit(20)
  return data ?? []
}

export async function submitMeme(submission: Omit<Submission, 'id' | 'vote_count' | 'status' | 'created_at'>): Promise<Submission | null> {
  const { data } = await supabase
    .from('submissions')
    .insert({ ...submission, vote_count: 0, status: 'pending' })
    .select()
    .single()
  return data
}

export async function voteOnSubmission(wallet: string, submissionId: string): Promise<boolean> {
  // Check if already voted today
  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabase
    .from('votes')
    .select('id')
    .eq('wallet', wallet)
    .gte('created_at', today)
    .single()

  if (existing) return false // already voted today

  const { error } = await supabase
    .from('votes')
    .insert({ wallet, submission_id: submissionId })

  return !error
}

export async function recordMintEvent(tokenId: number, wallet: string, txHash: string): Promise<void> {
  await supabase.from('mint_events').insert({
    token_id: tokenId,
    wallet,
    tx_hash: txHash,
  })
}

export async function getLeaderboard(period: 'all' | 'week' | 'today' = 'all'): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from('leaderboard_view') // materialized view
    .select('*')
    .order('total_mints', { ascending: false })
    .limit(50)

  if (period === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    query = supabase
      .from('mint_events')
      .select('wallet, count(*)')
      .gte('created_at', weekAgo)
  }

  const { data } = await query
  return (data ?? []).map((row: any, i: number) => ({ ...row, rank: i + 1 }))
}

export async function getWalletCollection(wallet: string): Promise<MintEvent[]> {
  const { data } = await supabase
    .from('mint_events')
    .select('*, drops(*)')
    .eq('wallet', wallet)
    .order('created_at', { ascending: false })
  return data ?? []
}
