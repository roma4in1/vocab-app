/**
 * SM-2 Spaced Repetition Algorithm
 * Based on SuperMemo 2 algorithm
 * 
 * Quality scores:
 * 5 - Perfect response
 * 4 - Correct response after hesitation
 * 3 - Correct response with difficulty
 * 2 - Incorrect response; correct answer seemed easy to recall
 * 1 - Incorrect response; correct answer seemed difficult to recall
 * 0 - Complete blackout
 */

export interface SM2Result {
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
}

export function calculateSM2(
  qualityScore: number,  // 0-5
  currentEaseFactor: number = 2.5,
  currentInterval: number = 1,
  currentRepetitions: number = 0
): SM2Result {
  let easeFactor = currentEaseFactor
  let interval = currentInterval
  let repetitions = currentRepetitions

  // If quality score is less than 3, reset repetitions
  if (qualityScore < 3) {
    repetitions = 0
    interval = 1
  } else {
    // Calculate new interval based on repetitions
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(currentInterval * currentEaseFactor)
    }
    
    repetitions += 1
  }

  // Calculate new ease factor
  easeFactor = currentEaseFactor + (0.1 - (5 - qualityScore) * (0.08 + (5 - qualityScore) * 0.02))

  // Ease factor should not be less than 1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3
  }

  // Calculate next review date
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + interval)

  return {
    easeFactor: Number(easeFactor.toFixed(2)),
    interval,
    repetitions,
    nextReviewDate
  }
}

/**
 * Check if a word is due for review
 */
export function isDueForReview(nextReviewDate: string | Date): boolean {
  const reviewDate = new Date(nextReviewDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  reviewDate.setHours(0, 0, 0, 0)
  
  return reviewDate <= today
}

/**
 * Get words that are due for review
 */
export function filterDueWords<T extends { next_review_date?: string | null }>(
  progressList: T[]
): T[] {
  return progressList.filter(progress => {
    if (!progress.next_review_date) return true // Never reviewed
    return isDueForReview(progress.next_review_date)
  })
}