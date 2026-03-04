import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createWalletClient, createPublicClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import { MEMEVAULT_ABI, CONTRACT_ADDRESSES } from '@/lib/contract/config'

// ── This runs every day at midnight UTC via Vercel Cron ─────────────────────
// Vercel calls: GET /api/cron/daily-drop
// Protect with CRON_SECRET env var

export async function GET(request: Request) {

  // 1. Verify cron secret (prevents unauthorized calls)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Init Supabase with service role (can write to protected tables)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 3. Find today's top-voted pending submission
    const { data: topSubmission, error: subError } = await supabase
      .from('submissions')
      .select('*')
      .eq('status', 'pending')
      .order('vote_count', { ascending: false })
      .limit(1)
      .single()

    if (subError || !topSubmission) {
      console.error('No pending submissions found:', subError)
      return NextResponse.json({ error: 'No submissions' }, { status: 404 })
    }

    // 4. Call createDrop() on the smart contract
    const account = privateKeyToAccount(
      process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`
    )

    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
    })

    const publicClient = createPublicClient({
      chain: base,
      transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
    })

    const { request: contractReq } = await publicClient.simulateContract({
      address: CONTRACT_ADDRESSES[base.id],
      abi: MEMEVAULT_ABI,
      functionName: 'createDrop',
      args: [
        topSubmission.metadata_uri,
        topSubmission.title,
        topSubmission.wallet,
      ],
      account,
    })

    const txHash = await walletClient.writeContract(contractReq)
    console.log('Drop created! tx:', txHash)

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    const tokenId = receipt.logs[0] // parse DropCreated event

    // 5. Get the new token ID from contract
    const currentDropId = await publicClient.readContract({
      address: CONTRACT_ADDRESSES[base.id],
      abi: MEMEVAULT_ABI,
      functionName: 'currentDropId',
    })

    // 6. Insert into Supabase drops table
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    const dropDate = tomorrow.toISOString().split('T')[0]

    const { error: insertError } = await supabase.from('drops').insert({
      id:           Number(currentDropId),
      title:        topSubmission.title,
      metadata_uri: topSubmission.metadata_uri,
      image_url:    topSubmission.image_url,
      submitted_by: topSubmission.wallet,
      tags:         topSubmission.tags,
      drop_date:    dropDate,
      is_active:    true,
    })

    if (insertError) throw insertError

    // 7. Mark submission as scheduled
    await supabase
      .from('submissions')
      .update({ status: 'scheduled' })
      .eq('id', topSubmission.id)

    console.log(`✅ Drop #${currentDropId} scheduled for ${dropDate}`)

    return NextResponse.json({
      success: true,
      dropId:  Number(currentDropId),
      title:   topSubmission.title,
      txHash,
      dropDate,
    })

  } catch (err) {
    console.error('Cron error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
