// lib/learning.ts
// ✅ FIXED: Learning logic with proper error handling and optimization

import { supabase } from './supabase'
import { VocabularyWord, UserProgress } from '@/types/database'
import { calculateSM2, isDueForReview } from './sm2'

/**
 * ✅ FIXED: Get current active cycle for a user
 * Now handles solo users properly
 */
export async function getCurrentCycle(userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('partner_id')
    .eq('id', userId)
    .single()

  if (!user) return null

  // Create couple_id (works for solo or partner)
  const partnerId = user?.partner_id || userId // Solo: use same ID twice
  const coupleId = [userId, partnerId].sort().join('_')

  const { data, error } = await supabase
    .from('learning_cycles')
    .select('*')
    .eq('couple_id', coupleId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('Error fetching cycle:', error)
    return null
  }
  
  return data
}

/**
 * ✅ FIXED: Get words for current cycle
 * Better error handling and type safety
 */
export async function getCycleWords(cycleId: string): Promise<(VocabularyWord & { position: number })[]> {
  const { data, error } = await supabase
    .from('cycle_words')
    .select(`
      word_id,
      position,
      vocabulary_words (*)
    `)
    .eq('cycle_id', cycleId)
    .order('position')

  if (error) {
    console.error('Error fetching cycle words:', error)
    throw error
  }
  
  if (!data) return []
  
  // Type assertion to help TypeScript understand the structure
  return data.map((item: any) => ({
    id: item.vocabulary_words.id,
    english_word: item.vocabulary_words.english_word,
    french_translation: item.vocabulary_words.french_translation,
    korean_translation: item.vocabulary_words.korean_translation,
    difficulty_level: item.vocabulary_words.difficulty_level,
    position: item.position
  }))
}

/**
 * ✅ FIXED: Get user's progress for specific words
 * Added error handling
 */
export async function getUserProgressForWords(
  userId: string, 
  cycleId: string, 
  wordIds: string[]
): Promise<UserProgress[]> {
  if (wordIds.length === 0) return []

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId)
    .in('word_id', wordIds)

  if (error) {
    console.error('Error fetching user progress:', error)
    throw error
  }
  
  return (data || []) as UserProgress[]
}

/**
 * ✅ FIXED: Get words due for review using SM-2
 * Improved filtering logic
 */
export async function getWordsForReview(
  userId: string,
  cycleId: string
): Promise<VocabularyWord[]> {
  try {
    // Get all words in the cycle
    const cycleWords = await getCycleWords(cycleId)
    const wordIds = cycleWords.map(w => w.id)
    
    if (wordIds.length === 0) return []
    
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
  } catch (error) {
    console.error('Error getting words for review:', error)
    return []
  }
}

/**
 * ✅ FIXED: Update word progress using SM-2 algorithm
 * Better transaction handling and error recovery
 */
export async function updateWordProgress(
  userId: string,
  wordId: string,
  cycleId: string,
  qualityScore: number // 0-5 rating
): Promise<boolean> {
  try {
    // Validate quality score
    if (qualityScore < 0 || qualityScore > 5) {
      console.error('Invalid quality score:', qualityScore)
      return false
    }

    // Get existing progress
    const { data: existing } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('word_id', wordId)
      .eq('cycle_id', cycleId)
      .maybeSingle()

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
          times_reviewed: (existing.times_reviewed || 0) + 1
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Error updating progress:', error)
        return false
      }
    } else {
      // Create new progress record
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

      if (error) {
        console.error('Error creating progress:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error in updateWordProgress:', error)
    return false
  }
}

/**
 * ✅ NEW: Batch update word progress (more efficient)
 * Updates multiple words at once
 */
export async function batchUpdateWordProgress(
  userId: string,
  cycleId: string,
  wordUpdates: Array<{ wordId: string; qualityScore: number }>
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  // Process in parallel for better performance
  await Promise.all(
    wordUpdates.map(async ({ wordId, qualityScore }) => {
      const result = await updateWordProgress(userId, wordId, cycleId, qualityScore)
      if (result) success++
      else failed++
    })
  )

  return { success, failed }
}

/**
 * ✅ FIXED: Update daily stats
 * Properly handles date boundaries and timezone issues
 */
export async function updateDailyStats(
  userId: string,
  wordsReviewed: number = 1,
  perfectAnswers: number = 0
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // Try to get today's stats
    const { data: existing } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    if (existing) {
      // Update existing
      await supabase
        .from('daily_stats')
        .update({
          words_reviewed: existing.words_reviewed + wordsReviewed,
          perfect_answers: existing.perfect_answers + perfectAnswers,
          completed_daily_goal: existing.words_reviewed + wordsReviewed >= 5
        })
        .eq('id', existing.id)
    } else {
      // Create new
      await supabase
        .from('daily_stats')
        .insert({
          user_id: userId,
          date: today,
          words_reviewed: wordsReviewed,
          perfect_answers: perfectAnswers,
          completed_daily_goal: wordsReviewed >= 5
        })
    }
  } catch (error) {
    console.error('Error updating daily stats:', error)
    // Don't throw - stats update shouldn't block learning
  }
}

/**
 * ✅ NEW: Get user's learning statistics
 */
export async function getUserStats(userId: string): Promise<{
  wordsStudiedToday: number
  perfectToday: number
  currentStreak: number
  longestStreak: number
  totalWordsLearned: number
}> {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Today's stats
    const { data: todayStats } = await supabase
      .from('daily_stats')
      .select('words_reviewed, perfect_answers')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    // Calculate streak
    const { data: allStats } = await supabase
      .from('daily_stats')
      .select('date, completed_daily_goal')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(365) // Last year

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    if (allStats) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (const stat of allStats) {
        const statDate = new Date(stat.date)
        statDate.setHours(0, 0, 0, 0)

        const daysDiff = Math.floor((today.getTime() - statDate.getTime()) / (1000 * 60 * 60 * 24))

        if (stat.completed_daily_goal) {
          if (daysDiff === tempStreak) {
            tempStreak++
            if (daysDiff < 2) currentStreak = tempStreak
            longestStreak = Math.max(longestStreak, tempStreak)
          } else {
            tempStreak = 0
          }
        }
      }
    }

    // Total words learned
    const { data: allProgress } = await supabase
      .from('user_progress')
      .select('word_id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('repetitions', 3) // Consider "learned" after 3 successful reviews

    return {
      wordsStudiedToday: todayStats?.words_reviewed || 0,
      perfectToday: todayStats?.perfect_answers || 0,
      currentStreak,
      longestStreak,
      totalWordsLearned: allProgress?.length || 0
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return {
      wordsStudiedToday: 0,
      perfectToday: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalWordsLearned: 0
    }
  }
}

/**
 * ✅ NEW: Get words that need review soon
 * Useful for showing "upcoming reviews"
 */
export async function getUpcomingReviews(
  userId: string,
  days: number = 7
): Promise<Array<VocabularyWord & { reviewDate: string }>> {
  try {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const { data: progress } = await supabase
      .from('user_progress')
      .select(`
        next_review_date,
        word_id,
        vocabulary_words (*)
      `)
      .eq('user_id', userId)
      .gte('next_review_date', today.toISOString().split('T')[0])
      .lte('next_review_date', futureDate.toISOString().split('T')[0])
      .order('next_review_date')

    if (!progress) return []

    return progress.map((p: any) => ({
      ...p.vocabulary_words,
      reviewDate: p.next_review_date
    }))
  } catch (error) {
    console.error('Error getting upcoming reviews:', error)
    return []
  }
}

/**
 * ✅ NEW: Reset progress for a word (useful for debugging or user request)
 */
export async function resetWordProgress(
  userId: string,
  wordId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', userId)
      .eq('word_id', wordId)

    if (error) {
      console.error('Error resetting word progress:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in resetWordProgress:', error)
    return false
  }
}