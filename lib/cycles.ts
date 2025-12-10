// lib/cycles.ts

import { supabase } from './supabase'

export interface CycleInfo {
  id: string
  cycle_number: number
  start_date: string
  end_date: string
  is_active: boolean
  is_expired: boolean
  days_remaining: number
  is_solo: boolean // New: indicates if this is a solo cycle
}

/**
 * Get couple_id for a user (works for both solo and partnered)
 * Solo: user_id_user_id
 * Partner: user1_id_user2_id (alphabetically sorted)
 */
function getCoupleId(userId: string, partnerId: string | null): string {
  if (!partnerId) {
    // Solo learning: use same ID twice
    return `${userId}_${userId}`
  }
  
  // Partner learning: sort IDs alphabetically
  return [userId, partnerId].sort().join('_')
}

/**
 * ✅ FIXED: Check if current cycle is expired and create new one if needed
 * Now works for BOTH solo and partner learning!
 */
export async function checkAndCreateNewCycle(userId: string): Promise<CycleInfo | null> {
  try {
    // Get user's partner info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('partner_id')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
      return null
    }

    // Determine couple_id (works for solo or partnered)
    const coupleId = getCoupleId(userId, user?.partner_id || null)
    const isSolo = !user?.partner_id

    console.log(`Loading cycle for ${isSolo ? 'SOLO' : 'PARTNER'} mode, couple_id: ${coupleId}`)

    // Get current active cycle
    const { data: currentCycle, error: cycleError } = await supabase
      .from('learning_cycles')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('is_active', true)
      .maybeSingle() // Use maybeSingle instead of single to avoid errors when no cycle exists

    if (cycleError) {
      console.error('Error fetching cycle:', cycleError)
      return null
    }

    if (!currentCycle) {
      console.log('No active cycle found, creating first one')
      return await createNewCycle(coupleId, 1, isSolo)
    }

    // Check if cycle is expired
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endDate = new Date(currentCycle.end_date)
    endDate.setHours(0, 0, 0, 0)

    const isExpired = today > endDate

    if (isExpired) {
      console.log('Cycle expired, creating new one')
      
      // Deactivate old cycle
      await supabase
        .from('learning_cycles')
        .update({ is_active: false })
        .eq('id', currentCycle.id)

      // Create new cycle
      return await createNewCycle(coupleId, currentCycle.cycle_number + 1, isSolo)
    }

    // Calculate days remaining
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    return {
      ...currentCycle,
      is_expired: false,
      days_remaining: Math.max(0, daysRemaining),
      is_solo: isSolo
    }
  } catch (error) {
    console.error('Error checking cycle:', error)
    return null
  }
}

/**
 * ✅ FIXED: Create a new learning cycle (works for solo or partner)
 */
async function createNewCycle(
  coupleId: string, 
  cycleNumber: number,
  isSolo: boolean
): Promise<CycleInfo> {
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 2) // 2 days from now

  // Create the cycle
  const { data: newCycle, error: cycleError } = await supabase
    .from('learning_cycles')
    .insert({
      couple_id: coupleId,
      cycle_number: cycleNumber,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      is_active: true
    })
    .select()
    .single()

  if (cycleError || !newCycle) {
    console.error('Failed to create cycle:', cycleError)
    throw new Error('Failed to create new cycle')
  }

  // Create cat state if it doesn't exist (for both solo and partner)
  const { error: catError } = await supabase
    .from('cat_state')
    .insert({
      couple_id: coupleId,
      happiness_level: 50,
      health_level: 100,
      current_streak_days: 0,
      longest_streak_days: 0
    })
    .select()
    .maybeSingle()

  // Ignore duplicate key errors (cat already exists)
  if (catError && !catError.message?.includes('duplicate')) {
    console.warn('Warning creating cat state:', catError)
  }

  // Get 5 random words, avoiding recently used ones
  const { data: recentWords } = await supabase
    .from('cycle_words')
    .select('word_id')
    .in('cycle_id', [
      // Get last 3 cycles for this couple
      ...(await supabase
        .from('learning_cycles')
        .select('id')
        .eq('couple_id', coupleId)
        .order('cycle_number', { ascending: false })
        .limit(3)
      ).data?.map(c => c.id) || []
    ])

  const excludeIds = recentWords?.map(w => w.word_id) || []

  // Try to get words NOT in recent cycles
  let query = supabase
    .from('vocabulary_words')
    .select('id')

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data: newWords } = await query
    .limit(5)
    .order('difficulty_level', { ascending: true }) // Start with easier words

  // If we don't have enough words, get any 5
  if (!newWords || newWords.length < 5) {
    const { data: fallbackWords } = await supabase
      .from('vocabulary_words')
      .select('id')
      .limit(5)

    if (fallbackWords && fallbackWords.length > 0) {
      await insertCycleWords(newCycle.id, fallbackWords)
    } else {
      throw new Error('No vocabulary words available in database!')
    }
  } else {
    await insertCycleWords(newCycle.id, newWords)
  }

  console.log(`Created new ${isSolo ? 'SOLO' : 'PARTNER'} cycle #${cycleNumber}`)

  return {
    ...newCycle,
    is_expired: false,
    days_remaining: 2,
    is_solo: isSolo
  }
}

/**
 * Insert words for a cycle
 */
async function insertCycleWords(cycleId: string, words: { id: string }[]) {
  const cycleWords = words.map((word, index) => ({
    cycle_id: cycleId,
    word_id: word.id,
    position: index + 1
  }))

  const { error } = await supabase
    .from('cycle_words')
    .insert(cycleWords)

  if (error) {
    console.error('Error inserting cycle words:', error)
    throw error
  }
}

/**
 * ✅ FIXED: Get cycle info with stats (works for solo or partner)
 */
export async function getCycleInfo(userId: string): Promise<{
  cycle: CycleInfo | null
  userProgress: number
  partnerProgress: number
  isSolo: boolean
}> {
  const cycle = await checkAndCreateNewCycle(userId)

  if (!cycle) {
    return { cycle: null, userProgress: 0, partnerProgress: 0, isSolo: true }
  }

  // Get user's partner
  const { data: user } = await supabase
    .from('users')
    .select('partner_id')
    .eq('id', userId)
    .single()

  const isSolo = !user?.partner_id

  // Count how many words user has reviewed in this cycle
  const { data: userReviews } = await supabase
    .from('user_progress')
    .select('word_id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('cycle_id', cycle.id)

  let partnerProgress = 0
  
  if (!isSolo && user?.partner_id) {
    // Count partner's progress only if not solo
    const { data: partnerReviews } = await supabase
      .from('user_progress')
      .select('word_id', { count: 'exact' })
      .eq('user_id', user.partner_id)
      .eq('cycle_id', cycle.id)

    partnerProgress = partnerReviews?.length || 0
  }

  return {
    cycle,
    userProgress: userReviews?.length || 0,
    partnerProgress,
    isSolo
  }
}

/**
 * ✅ NEW: Force create a new cycle (useful for testing or resetting)
 */
export async function forceNewCycle(userId: string): Promise<CycleInfo | null> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('partner_id')
      .eq('id', userId)
      .single()

    const coupleId = getCoupleId(userId, user?.partner_id || null)
    const isSolo = !user?.partner_id

    // Deactivate all active cycles
    await supabase
      .from('learning_cycles')
      .update({ is_active: false })
      .eq('couple_id', coupleId)
      .eq('is_active', true)

    // Get highest cycle number
    const { data: cycles } = await supabase
      .from('learning_cycles')
      .select('cycle_number')
      .eq('couple_id', coupleId)
      .order('cycle_number', { ascending: false })
      .limit(1)

    const nextCycleNumber = (cycles?.[0]?.cycle_number || 0) + 1

    return await createNewCycle(coupleId, nextCycleNumber, isSolo)
  } catch (error) {
    console.error('Error forcing new cycle:', error)
    return null
  }
}