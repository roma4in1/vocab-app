import { supabase } from './supabase'

export interface CycleInfo {
  id: string
  cycle_number: number
  start_date: string
  end_date: string
  is_active: boolean
  is_expired: boolean
  days_remaining: number
}

// Check if current cycle is expired and create new one if needed
export async function checkAndCreateNewCycle(userId: string): Promise<CycleInfo | null> {
  try {
    // Get user's partner info
    const { data: user } = await supabase
      .from('users')
      .select('partner_id')
      .eq('id', userId)
      .single()

    if (!user?.partner_id) {
      console.log('No partner found')
      return null
    }

    const partnerId = user.partner_id
    const coupleId = [userId, partnerId].sort().join('_')

    // Get current active cycle
    const { data: currentCycle } = await supabase
      .from('learning_cycles')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('is_active', true)
      .single()

    if (!currentCycle) {
      console.log('No active cycle found, creating first one')
      return await createNewCycle(coupleId, 1)
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
      return await createNewCycle(coupleId, currentCycle.cycle_number + 1)
    }

    // Calculate days remaining
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    return {
      ...currentCycle,
      is_expired: false,
      days_remaining: daysRemaining
    }
  } catch (error) {
    console.error('Error checking cycle:', error)
    return null
  }
}

// Create a new learning cycle
async function createNewCycle(coupleId: string, cycleNumber: number): Promise<CycleInfo> {
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
    throw new Error('Failed to create new cycle')
  }

  // Get 5 random words that haven't been used recently
  const { data: recentWords } = await supabase
    .from('cycle_words')
    .select('word_id')
    .limit(15) // Avoid last 15 words used

  const excludeIds = recentWords?.map(w => w.word_id) || []

  let query = supabase
    .from('vocabulary_words')
    .select('id')

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data: newWords } = await query.limit(5)

  // If we don't have enough words, just get any 5
  if (!newWords || newWords.length < 5) {
    const { data: fallbackWords } = await supabase
      .from('vocabulary_words')
      .select('id')
      .limit(5)

    if (fallbackWords) {
      await insertCycleWords(newCycle.id, fallbackWords)
    }
  } else {
    await insertCycleWords(newCycle.id, newWords)
  }

  return {
    ...newCycle,
    is_expired: false,
    days_remaining: 2
  }
}

// Insert words for a cycle
async function insertCycleWords(cycleId: string, words: { id: string }[]) {
  const cycleWords = words.map((word, index) => ({
    cycle_id: cycleId,
    word_id: word.id,
    position: index + 1
  }))

  await supabase.from('cycle_words').insert(cycleWords)
}

// Get cycle info with stats
export async function getCycleInfo(userId: string): Promise<{
  cycle: CycleInfo | null
  userProgress: number
  partnerProgress: number
}> {
  const cycle = await checkAndCreateNewCycle(userId)

  if (!cycle) {
    return { cycle: null, userProgress: 0, partnerProgress: 0 }
  }

  // Get user's partner
  const { data: user } = await supabase
    .from('users')
    .select('partner_id')
    .eq('id', userId)
    .single()

  if (!user?.partner_id) {
    return { cycle, userProgress: 0, partnerProgress: 0 }
  }

  // Count how many words each person has reviewed in this cycle
  const { data: userReviews } = await supabase
    .from('user_progress')
    .select('word_id')
    .eq('user_id', userId)
    .eq('cycle_id', cycle.id)

  const { data: partnerReviews } = await supabase
    .from('user_progress')
    .select('word_id')
    .eq('user_id', user.partner_id)
    .eq('cycle_id', cycle.id)

  return {
    cycle,
    userProgress: userReviews?.length || 0,
    partnerProgress: partnerReviews?.length || 0
  }
}