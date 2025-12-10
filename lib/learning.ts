import { supabase } from './supabase'
import { VocabularyWord, UserProgress } from '@/types/database'
import { calculateSM2, isDueForReview } from './sm2'

// Get current active cycle for a user
export async function getCurrentCycle(userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('partner_id')
    .eq('id', userId)
    .single()

  // Create couple_id (use same user ID twice if no partner - for testing)
  const partnerId = user?.partner_id || userId
  const coupleId = [userId, partnerId].sort().join('_')

  const { data, error } = await supabase
    .from('learning_cycles')
    .select('*')
    .eq('couple_id', coupleId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching cycle:', error)
    return null
  }
  
  return data
}

// Get words for current cycle
export async function getCycleWords(cycleId: string) {
  const { data, error } = await supabase
    .from('cycle_words')
    .select(`
      word_id,
      position,
      vocabulary_words (*)
    `)
    .eq('cycle_id', cycleId)
    .order('position')

  if (error) throw error
  if (!data) return []
  
  // Type assertion to help TypeScript understand the structure
  return data.map((item: any) => ({
    id: item.vocabulary_words.id,
    english_word: item.vocabulary_words.english_word,
    french_translation: item.vocabulary_words.french_translation,
    korean_translation: item.vocabulary_words.korean_translation,
    difficulty_level: item.vocabulary_words.difficulty_level,
    position: item.position
  })) as (VocabularyWord & { position: number })[]
}

// Get user's progress for specific words
export async function getUserProgressForWords(
  userId: string, 
  cycleId: string, 
  wordIds: string[]
) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId)
    .in('word_id', wordIds)

  if (error) throw error
  return data as UserProgress[]
}

// Get words due for review using SM-2
export async function getWordsForReview(
  userId: string,
  cycleId: string
) {
  // Get all words in the cycle
  const cycleWords = await getCycleWords(cycleId)
  const wordIds = cycleWords.map(w => w.id)
  
  // Get user's progress
  const progress = await getUserProgressForWords(userId, cycleId, wordIds)
  
  // Filter to words that are due for review
  const dueWords = cycleWords.filter(word => {
    const wordProgress = progress.find(p => p.word_id === word.id)
    
    // If no progress, it's a new word - should be reviewed
    if (!wordProgress) return true
    
    // Check if it's due based on SM-2 schedule
    if (!wordProgress.next_review_date) return true
    
    return isDueForReview(wordProgress.next_review_date)
  })
  
  return dueWords
}

// Update word progress using SM-2 algorithm
export async function updateWordProgress(
  userId: string,
  wordId: string,
  cycleId: string,
  qualityScore: number // 0-5 rating
) {
  // Get existing progress
  const { data: existing } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .eq('cycle_id', cycleId)
    .single()

  const now = new Date().toISOString()

  // Calculate SM-2 values
  const sm2Result = calculateSM2(
    qualityScore,
    existing?.ease_factor || 2.5,
    existing?.interval || 1,
    existing?.repetitions || 0
  )

  if (existing) {
    // Update existing progress
    const { error } = await supabase
      .from('user_progress')
      .update({
        ease_factor: sm2Result.easeFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        next_review_date: sm2Result.nextReviewDate.toISOString().split('T')[0],
        quality_score: qualityScore,
        last_reviewed_at: now,
        times_reviewed: existing.times_reviewed + 1,
        updated_at: now
      })
      .eq('id', existing.id)

    if (error) throw error
  } else {
    // Create new progress
    const { error } = await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        word_id: wordId,
        cycle_id: cycleId,
        ease_factor: sm2Result.easeFactor,
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        next_review_date: sm2Result.nextReviewDate.toISOString().split('T')[0],
        quality_score: qualityScore,
        last_reviewed_at: now,
        times_reviewed: 1
      })

    if (error) throw error
  }

  // Record the review session
  await supabase.from('review_sessions').insert({
    user_id: userId,
    word_id: wordId,
    cycle_id: cycleId,
    quality_score: qualityScore,
    was_correct: qualityScore >= 3
  })
}

// Update daily stats
export async function updateDailyStats(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  
  // Get today's review count
  const { data: sessions } = await supabase
    .from('review_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('reviewed_at', `${today}T00:00:00`)
    .lte('reviewed_at', `${today}T23:59:59`)
  
  const wordsReviewed = sessions?.length || 0
  const perfectAnswers = sessions?.filter(s => s.quality_score === 5).length || 0
  
  // Upsert daily stats
  await supabase
    .from('daily_stats')
    .upsert({
      user_id: userId,
      date: today,
      words_reviewed: wordsReviewed,
      perfect_answers: perfectAnswers,
      completed_daily_goal: wordsReviewed >= 5
    }, {
      onConflict: 'user_id,date'
    })
}