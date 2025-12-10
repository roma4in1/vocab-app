// lib/sm2.ts
// ✅ FIXED: SM-2 algorithm with proper boundary enforcement and interval capping

export interface SM2Result {
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
}

/**
 * ✅ FIXED: Calculate next review using SM-2 algorithm
 * Now enforces all boundaries properly!
 * 
 * Quality scores:
 * 5 - Perfect response
 * 4 - Correct response after hesitation  
 * 3 - Correct response with difficulty
 * 2 - Incorrect response; correct answer seemed easy to recall
 * 1 - Incorrect response; correct answer seemed difficult to recall
 * 0 - Complete blackout
 * 
 * @param qualityScore - Rating from 0-5
 * @param currentEaseFactor - Current EF (default 2.5)
 * @param currentInterval - Current interval in days (default 1)
 * @param currentRepetitions - Current repetition count (default 0)
 */
export function calculateSM2(
  qualityScore: number,
  currentEaseFactor: number = 2.5,
  currentInterval: number = 1,
  currentRepetitions: number = 0
): SM2Result {
  // ✅ FIX #13: Validate quality score range
  if (qualityScore < 0 || qualityScore > 5) {
    console.warn(`Invalid quality score: ${qualityScore}, clamping to 0-5`)
    qualityScore = Math.max(0, Math.min(5, qualityScore))
  }

  let easeFactor = currentEaseFactor
  let interval = currentInterval
  let repetitions = currentRepetitions

  // If quality score is less than 3, reset repetitions and interval
  if (qualityScore < 3) {
    repetitions = 0
    interval = 1
  } else {
    // Quality >= 3: correct answer, increase interval
    if (repetitions === 0) {
      interval = 1 // First review: 1 day
    } else if (repetitions === 1) {
      interval = 6 // Second review: 6 days
    } else {
      // Subsequent reviews: multiply by ease factor
      interval = Math.round(currentInterval * currentEaseFactor)
    }
    
    repetitions += 1
  }

  // ✅ FIX #10: Calculate new ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = currentEaseFactor + (0.1 - (5 - qualityScore) * (0.08 + (5 - qualityScore) * 0.02))

  // ✅ FIX #10: Enforce ease factor minimum (1.3)
  if (easeFactor < 1.3) {
    easeFactor = 1.3
  }

  // ✅ FIX #10: Enforce ease factor maximum (2.5) for practical reasons
  if (easeFactor > 2.5) {
    easeFactor = 2.5
  }

  // ✅ FIX #11: Cap maximum interval at 365 days (1 year)
  if (interval > 365) {
    interval = 365
  }

  // ✅ FIX #12: Ensure interval is at least 1
  if (interval < 1) {
    interval = 1
  }

  // Calculate next review date
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + interval)

  return {
    easeFactor: Number(easeFactor.toFixed(2)), // Round to 2 decimal places
    interval,
    repetitions,
    nextReviewDate
  }
}

/**
 * Check if a word is due for review
 * ✅ FIX #6: Timezone-safe date comparison
 */
export function isDueForReview(nextReviewDate: string | Date): boolean {
  const reviewDate = new Date(nextReviewDate)
  const today = new Date()
  
  // Normalize both dates to midnight UTC to avoid timezone issues
  reviewDate.setUTCHours(0, 0, 0, 0)
  today.setUTCHours(0, 0, 0, 0)
  
  return reviewDate <= today
}

/**
 * Get words that are due for review from a list
 */
export function filterDueWords<T extends { next_review_date?: string | null }>(
  progressList: T[]
): T[] {
  return progressList.filter(progress => {
    if (!progress.next_review_date) return true // Never reviewed
    return isDueForReview(progress.next_review_date)
  })
}

/**
 * ✅ NEW: Calculate optimal review schedule preview
 * Shows user when they'll see this word again
 */
export function getReviewSchedulePreview(currentInterval: number, easeFactor: number): {
  nextIntervals: number[]
  dates: Date[]
} {
  const intervals: number[] = []
  const dates: Date[] = []
  let interval = currentInterval
  
  // Calculate next 5 review intervals
  for (let i = 0; i < 5; i++) {
    interval = Math.min(365, Math.round(interval * easeFactor))
    intervals.push(interval)
    
    const date = new Date()
    date.setDate(date.getDate() + intervals.reduce((a, b) => a + b, 0))
    dates.push(date)
  }
  
  return { nextIntervals: intervals, dates }
}

/**
 * ✅ NEW: Get difficulty level based on ease factor and repetitions
 * Useful for UI indicators
 */
export function getDifficultyLevel(easeFactor: number, repetitions: number): 
  'new' | 'learning' | 'young' | 'mature' | 'easy' {
  
  if (repetitions === 0) return 'new'
  if (repetitions <= 2) return 'learning'
  if (easeFactor < 2.0) return 'young'
  if (easeFactor < 2.3) return 'mature'
  return 'easy'
}

/**
 * ✅ NEW: Calculate retention probability
 * Based on interval and ease factor
 * Useful for showing confidence level to user
 */
export function calculateRetentionProbability(
  daysSinceReview: number,
  easeFactor: number,
  repetitions: number
): number {
  // Simple exponential decay model
  // Higher EF = slower decay (better retention)
  // More reps = better base retention
  
  const baseRetention = 0.9 // Start at 90% right after review
  const decayRate = 0.05 / easeFactor // Slower decay for higher EF
  const repBonus = Math.min(0.1, repetitions * 0.02) // Up to 10% bonus
  
  const retention = (baseRetention + repBonus) * Math.exp(-decayRate * daysSinceReview)
  
  return Math.max(0, Math.min(1, retention))
}

/**
 * ✅ NEW: Suggest optimal quality score based on attempt count
 * Helps auto-calculate scores for activities
 */
export function suggestQualityScore(attempts: number, timeSeconds: number): number {
  // Perfect on first try, fast → 5
  if (attempts === 1 && timeSeconds < 3) return 5
  
  // Correct on first try, normal speed → 4
  if (attempts === 1 && timeSeconds < 10) return 4
  
  // Correct on first try, slow → 3
  if (attempts === 1) return 3
  
  // Correct on second try → 2
  if (attempts === 2) return 2
  
  // Correct on third try → 1
  if (attempts === 3) return 1
  
  // More than 3 attempts → 0
  return 0
}

/**
 * ✅ NEW: Batch calculate SM-2 for multiple words
 * More efficient for session completion
 */
export function batchCalculateSM2(
  wordProgresses: Array<{
    qualityScore: number
    currentEaseFactor?: number
    currentInterval?: number
    currentRepetitions?: number
  }>
): SM2Result[] {
  return wordProgresses.map(progress =>
    calculateSM2(
      progress.qualityScore,
      progress.currentEaseFactor || 2.5,
      progress.currentInterval || 1,
      progress.currentRepetitions || 0
    )
  )
}

/**
 * ✅ NEW: Debug SM-2 calculation
 * Useful for troubleshooting
 */
export function debugSM2(
  qualityScore: number,
  currentEaseFactor: number,
  currentInterval: number,
  currentRepetitions: number
): string {
  const result = calculateSM2(qualityScore, currentEaseFactor, currentInterval, currentRepetitions)
  
  return `
SM-2 Calculation Debug:
Input:
  - Quality Score: ${qualityScore}
  - Current EF: ${currentEaseFactor}
  - Current Interval: ${currentInterval} days
  - Current Repetitions: ${currentRepetitions}

Output:
  - New EF: ${result.easeFactor}
  - New Interval: ${result.interval} days
  - New Repetitions: ${result.repetitions}
  - Next Review: ${result.nextReviewDate.toDateString()}
  
Decision:
  ${qualityScore < 3 ? '❌ Failed - Reset to beginning' : '✅ Passed - Interval increased'}
  ${result.interval === 365 ? '⚠️  Capped at maximum (365 days)' : ''}
  ${result.easeFactor === 1.3 ? '⚠️  EF at minimum (1.3)' : ''}
  ${result.easeFactor === 2.5 ? '⚠️  EF at maximum (2.5)' : ''}
  `.trim()
}