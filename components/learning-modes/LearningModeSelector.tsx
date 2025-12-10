// components/learning-modes/LearningModeSelector.tsx
// Intelligently selects and renders the appropriate learning mode

'use client'

import { useState, useEffect } from 'react'
import MultipleChoice from './MultipleChoice'
import ListeningComprehension from './ListeningComprehension'
import SpeedRound from './SpeedRound'
import SentenceBuilder from './SentenceBuilder'

interface VocabularyWord {
  id: string
  word: string
  translation: string
  language: 'french' | 'korean'
  repetition: number // For SM-2 algorithm
}

interface ModeSelectorProps {
  currentWord: VocabularyWord
  allWords: VocabularyWord[] // For generating options and speed rounds
  onComplete: (wordId: string, quality: number) => void
}

type ModeType = 
  | 'multiple-choice-to-english'
  | 'multiple-choice-from-english'
  | 'listening-comprehension'
  | 'speed-round'
  | 'sentence-builder'
  | 'flashcard'

export default function LearningModeSelector({
  currentWord,
  allWords,
  onComplete
}: ModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<ModeType | null>(null)
  const [incorrectOptions, setIncorrectOptions] = useState<string[]>([])

  useEffect(() => {
    // Select mode based on word's learning progress and randomization
    const mode = selectOptimalMode(currentWord)
    setSelectedMode(mode)

    // Generate incorrect options if needed
    if (mode.includes('multiple-choice') || mode === 'listening-comprehension') {
      setIncorrectOptions(generateIncorrectOptions(currentWord, allWords))
    }
  }, [currentWord, allWords])

  const selectOptimalMode = (word: VocabularyWord): ModeType => {
    // Distribution based on learning stage
    const { repetition } = word

    // New words (repetition 0-2): Focus on recognition
    if (repetition <= 2) {
      const modes: ModeType[] = [
        'multiple-choice-to-english',
        'multiple-choice-to-english', // Higher weight
        'listening-comprehension'
      ]
      return modes[Math.floor(Math.random() * modes.length)]
    }

    // Learning words (repetition 3-5): Mixed practice
    if (repetition <= 5) {
      const modes: ModeType[] = [
        'multiple-choice-to-english',
        'multiple-choice-from-english',
        'listening-comprehension',
        'sentence-builder'
      ]
      return modes[Math.floor(Math.random() * modes.length)]
    }

    // Familiar words (repetition 6+): Production and speed
    const modes: ModeType[] = [
      'multiple-choice-from-english',
      'sentence-builder',
      'listening-comprehension'
    ]
    
    // 10% chance of speed round for very familiar words
    if (repetition >= 10 && Math.random() < 0.1) {
      return 'speed-round'
    }

    return modes[Math.floor(Math.random() * modes.length)]
  }

  const generateIncorrectOptions = (
    word: VocabularyWord,
    words: VocabularyWord[]
  ): string[] => {
    // Filter out the current word and get same language words
    const sameLanguage = words.filter(
      w => w.id !== word.id && w.language === word.language
    )

    // Shuffle and take 3 random translations
    const shuffled = [...sameLanguage].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 3).map(w => w.translation)
  }

  const handleComplete = (quality: number) => {
    onComplete(currentWord.id, quality)
  }

  if (!selectedMode) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // Render the selected mode
  switch (selectedMode) {
    case 'multiple-choice-to-english':
      return (
        <MultipleChoice
          word={currentWord.word}
          correctTranslation={currentWord.translation}
          incorrectOptions={incorrectOptions}
          language={currentWord.language}
          questionType="toEnglish"
          onComplete={handleComplete}
        />
      )

    case 'multiple-choice-from-english':
      return (
        <MultipleChoice
          word={currentWord.word}
          correctTranslation={currentWord.translation}
          incorrectOptions={incorrectOptions}
          language={currentWord.language}
          questionType="fromEnglish"
          onComplete={handleComplete}
        />
      )

    case 'listening-comprehension':
      return (
        <ListeningComprehension
          word={currentWord.word}
          correctTranslation={currentWord.translation}
          incorrectOptions={incorrectOptions}
          language={currentWord.language}
          onComplete={handleComplete}
        />
      )

    case 'sentence-builder':
      return (
        <SentenceBuilder
          word={currentWord.word}
          translation={currentWord.translation}
          language={currentWord.language}
          onComplete={handleComplete}
        />
      )

    case 'speed-round':
      // Speed round uses multiple words
      const speedWords = allWords
        .filter(w => w.language === currentWord.language && w.repetition >= 6)
        .slice(0, 5)
        .map(w => ({
          id: w.id,
          word: w.word,
          translation: w.translation
        }))

      return (
        <SpeedRound
          words={speedWords}
          language={currentWord.language}
          timePerWord={30}
          onComplete={(results) => {
            // Handle multiple word results
            results.forEach(result => {
              onComplete(result.wordId, result.quality)
            })
          }}
        />
      )

    default:
      return (
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-gray-600">Mode not implemented</div>
        </div>
      )
  }
}

// Mode distribution explanation component (optional - for debugging)
export function ModeDistributionInfo() {
  return (
    <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
      <h3 className="font-semibold mb-2">Learning Mode Distribution:</h3>
      <ul className="space-y-1">
        <li><strong>New words (0-2 reps):</strong> Focus on recognition (Multiple Choice, Listening)</li>
        <li><strong>Learning (3-5 reps):</strong> Mixed practice (All modes except Speed Round)</li>
        <li><strong>Familiar (6+ reps):</strong> Production focus (Sentence Builder, From-English MC)</li>
        <li><strong>Mastered (10+ reps):</strong> 10% chance of Speed Round</li>
      </ul>
    </div>
  )
}