// lib/catHappiness.ts
// ✅ FIXED: Now supports SOLO and PARTNER modes

interface UserProgress {
  wordsStudiedToday: number
  targetWordsPerDay: number
  streakDays: number
}

interface HappinessInput {
  user: UserProgress
  partner?: UserProgress // Optional for solo mode
}

/**
 * ✅ FIXED: Calculate cat happiness (0-100)
 * Now adapts to solo or partner mode!
 * 
 * Algorithm:
 * - Solo mode: Based only on user's progress
 * - Partner mode: Averaged between both partners (with bonus for sync)
 */
export function calculateCatHappiness(input: HappinessInput): number {
  const isSolo = !input.partner

  if (isSolo) {
    // Solo mode: happiness based purely on user's own progress
    return calculateSoloHappiness(input.user)
  } else {
    // Partner mode: collaborative happiness
    return calculatePartnerHappiness(input.user, input.partner!)
  }
}

/**
 * Calculate happiness for solo learning
 * More forgiving since there's no partner dependency
 */
function calculateSoloHappiness(user: UserProgress): number {
  let happiness = 0

  // Base happiness from daily progress (0-60 points)
  const dailyProgress = user.wordsStudiedToday / user.targetWordsPerDay
  happiness += Math.min(60, dailyProgress * 60)

  // Streak bonus (0-30 points)
  // More generous: 10 points per week of streak
  const streakBonus = Math.min(30, (user.streakDays / 7) * 10)
  happiness += streakBonus

  // Consistency bonus (0-10 points)
  // Give bonus if user is making steady progress
  if (user.wordsStudiedToday >= user.targetWordsPerDay * 0.5) {
    happiness += 10
  }

  return Math.round(Math.min(100, Math.max(0, happiness)))
}

/**
 * Calculate happiness for partner learning
 * Requires both partners to participate
 */
function calculatePartnerHappiness(user: UserProgress, partner: UserProgress): number {
  let happiness = 0

  // Individual progress (0-40 points each = 0-80 total)
  const userProgress = (user.wordsStudiedToday / user.targetWordsPerDay) * 40
  const partnerProgress = (partner.wordsStudiedToday / partner.targetWordsPerDay) * 40
  happiness += userProgress + partnerProgress

  // Shared streak bonus (0-15 points)
  const minStreak = Math.min(user.streakDays, partner.streakDays)
  const streakBonus = Math.min(15, (minStreak / 7) * 5)
  happiness += streakBonus

  // Synchronization bonus (0-5 points)
  // Bonus if both partners are keeping up with each other
  const progressDifference = Math.abs(
    user.wordsStudiedToday - partner.wordsStudiedToday
  )
  if (progressDifference <= 2) {
    happiness += 5
  }

  return Math.round(Math.min(100, Math.max(0, happiness)))
}

/**
 * Get cat mood description based on happiness level
 */
export function getCatMoodDescription(happiness: number, isSolo: boolean): string {
  if (happiness >= 75) {
    return isSolo 
      ? "Your cat is thrilled! You're doing amazing! 😸"
      : "Your cat is thrilled! Both of you are doing great! 😸"
  } else if (happiness >= 50) {
    return isSolo
      ? "Your cat is content. Keep up the good work! 😺"
      : "Your cat is content. Both partners are making progress! 😺"
  } else if (happiness >= 25) {
    return isSolo
      ? "Your cat is getting worried. Time to study! 😿"
      : "Your cat is getting worried. Time to study together! 😿"
  } else {
    return isSolo
      ? "Your cat is very upset! Time to catch up on learning! 😾"
      : "Your cat is very upset! Both partners need to catch up! 😾"
  }
}

/**
 * Get cat emotion for rendering
 */
export function getCatEmotion(happiness: number): 'happy' | 'neutral' | 'sad' | 'angry' {
  if (happiness >= 75) return 'happy'
  if (happiness >= 50) return 'neutral'
  if (happiness >= 25) return 'sad'
  return 'angry'
}

/**
 * Calculate happiness from database records
 */
export function calculateHappinessFromDatabase(
  userStats: {
    words_studied_today: number
    current_streak: number
  },
  partnerStats?: {
    words_studied_today: number
    current_streak: number
  }
): number {
  const TARGET_WORDS = 5 // 5 words per 2-day cycle (avg 2.5/day)

  const input: HappinessInput = {
    user: {
      wordsStudiedToday: userStats.words_studied_today,
      targetWordsPerDay: TARGET_WORDS,
      streakDays: userStats.current_streak,
    }
  }

  // Add partner if provided
  if (partnerStats) {
    input.partner = {
      wordsStudiedToday: partnerStats.words_studied_today,
      targetWordsPerDay: TARGET_WORDS,
      streakDays: partnerStats.current_streak,
    }
  }

  return calculateCatHappiness(input)
}

/**
 * ✅ NEW: Calculate target happiness for user motivation
 * Shows what happiness would be if they complete today's goal
 */
export function calculateTargetHappiness(
  currentWordsToday: number,
  targetWords: number,
  streakDays: number,
  isSolo: boolean
): number {
  const input: HappinessInput = {
    user: {
      wordsStudiedToday: targetWords, // Simulate completing goal
      targetWordsPerDay: targetWords,
      streakDays: streakDays + 1, // Assume maintaining streak
    }
  }

  if (!isSolo) {
    // Assume partner also completes (optimistic)
    input.partner = {
      wordsStudiedToday: targetWords,
      targetWordsPerDay: targetWords,
      streakDays: streakDays + 1,
    }
  }

  return calculateCatHappiness(input)
}

/**
 * ✅ NEW: Get encouragement message based on progress
 */
export function getEncouragementMessage(
  wordsCompleted: number,
  targetWords: number,
  isSolo: boolean
): string {
  const progress = wordsCompleted / targetWords

  if (progress >= 1) {
    return isSolo
      ? "🎉 Goal completed! Your cat is proud of you!"
      : "🎉 Daily goal reached! Your cat is purring with joy!"
  } else if (progress >= 0.75) {
    return isSolo
      ? "💪 Almost there! Just a bit more!"
      : "💪 Both of you are so close! Keep going!"
  } else if (progress >= 0.5) {
    return isSolo
      ? "👍 Halfway there! You're doing great!"
      : "👍 You're both making good progress!"
  } else if (progress >= 0.25) {
    return isSolo
      ? "🌱 Good start! Keep the momentum going!"
      : "🌱 Good start team! Your cat believes in you!"
  } else {
    return isSolo
      ? "📚 Ready to start learning? Your cat is waiting!"
      : "📚 Ready to learn together? Your cat misses you!"
  }
}