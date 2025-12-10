// app/api/seed-vocabulary/route.ts
// API route to bulk insert vocabulary
// Visit: http://localhost:3000/api/seed-vocabulary

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const vocabulary = [
  // GREETINGS & BASICS (10 words)
  { english: "hello", french: "bonjour", korean: "안녕하세요", difficulty: 1 },
  { english: "goodbye", french: "au revoir", korean: "안녕히 가세요", difficulty: 1 },
  { english: "please", french: "s'il vous plaît", korean: "제발", difficulty: 1 },
  { english: "thank you", french: "merci", korean: "감사합니다", difficulty: 1 },
  { english: "yes", french: "oui", korean: "네", difficulty: 1 },
  { english: "no", french: "non", korean: "아니요", difficulty: 1 },
  { english: "excuse me", french: "excusez-moi", korean: "실례합니다", difficulty: 1 },
  { english: "sorry", french: "désolé", korean: "미안합니다", difficulty: 1 },
  { english: "good morning", french: "bon matin", korean: "좋은 아침", difficulty: 1 },
  { english: "good night", french: "bonne nuit", korean: "안녕히 주무세요", difficulty: 1 },

  // COMMON VERBS (15 words)
  { english: "to be", french: "être", korean: "이다", difficulty: 2 },
  { english: "to have", french: "avoir", korean: "가지다", difficulty: 2 },
  { english: "to do", french: "faire", korean: "하다", difficulty: 2 },
  { english: "to go", french: "aller", korean: "가다", difficulty: 2 },
  { english: "to eat", french: "manger", korean: "먹다", difficulty: 1 },
  { english: "to drink", french: "boire", korean: "마시다", difficulty: 1 },
  { english: "to sleep", french: "dormir", korean: "자다", difficulty: 1 },
  { english: "to want", french: "vouloir", korean: "원하다", difficulty: 2 },
  { english: "to like", french: "aimer", korean: "좋아하다", difficulty: 1 },
  { english: "to see", french: "voir", korean: "보다", difficulty: 2 },
  { english: "to know", french: "savoir", korean: "알다", difficulty: 2 },
  { english: "to come", french: "venir", korean: "오다", difficulty: 2 },
  { english: "to give", french: "donner", korean: "주다", difficulty: 2 },
  { english: "to speak", french: "parler", korean: "말하다", difficulty: 2 },
  { english: "to understand", french: "comprendre", korean: "이해하다", difficulty: 2 },

  // FOOD & DRINK (15 words)
  { english: "water", french: "eau", korean: "물", difficulty: 1 },
  { english: "coffee", french: "café", korean: "커피", difficulty: 1 },
  { english: "tea", french: "thé", korean: "차", difficulty: 1 },
  { english: "bread", french: "pain", korean: "빵", difficulty: 1 },
  { english: "rice", french: "riz", korean: "밥", difficulty: 1 },
  { english: "meat", french: "viande", korean: "고기", difficulty: 1 },
  { english: "fish", french: "poisson", korean: "생선", difficulty: 1 },
  { english: "fruit", french: "fruit", korean: "과일", difficulty: 1 },
  { english: "vegetable", french: "légume", korean: "채소", difficulty: 1 },
  { english: "milk", french: "lait", korean: "우유", difficulty: 1 },
  { english: "egg", french: "œuf", korean: "계란", difficulty: 1 },
  { english: "cheese", french: "fromage", korean: "치즈", difficulty: 1 },
  { english: "chicken", french: "poulet", korean: "닭고기", difficulty: 1 },
  { english: "apple", french: "pomme", korean: "사과", difficulty: 1 },
  { english: "wine", french: "vin", korean: "와인", difficulty: 1 },

  // NUMBERS (10 words)
  { english: "one", french: "un", korean: "일", difficulty: 1 },
  { english: "two", french: "deux", korean: "이", difficulty: 1 },
  { english: "three", french: "trois", korean: "삼", difficulty: 1 },
  { english: "four", french: "quatre", korean: "사", difficulty: 1 },
  { english: "five", french: "cinq", korean: "오", difficulty: 1 },
  { english: "six", french: "six", korean: "육", difficulty: 1 },
  { english: "seven", french: "sept", korean: "칠", difficulty: 1 },
  { english: "eight", french: "huit", korean: "팔", difficulty: 1 },
  { english: "nine", french: "neuf", korean: "구", difficulty: 1 },
  { english: "ten", french: "dix", korean: "십", difficulty: 1 },

  // FAMILY & PEOPLE (10 words)
  { english: "family", french: "famille", korean: "가족", difficulty: 1 },
  { english: "father", french: "père", korean: "아버지", difficulty: 1 },
  { english: "mother", french: "mère", korean: "어머니", difficulty: 1 },
  { english: "brother", french: "frère", korean: "형제", difficulty: 1 },
  { english: "sister", french: "sœur", korean: "자매", difficulty: 1 },
  { english: "friend", french: "ami", korean: "친구", difficulty: 1 },
  { english: "man", french: "homme", korean: "남자", difficulty: 1 },
  { english: "woman", french: "femme", korean: "여자", difficulty: 1 },
  { english: "child", french: "enfant", korean: "아이", difficulty: 1 },
  { english: "person", french: "personne", korean: "사람", difficulty: 1 },

  // COLORS (10 words)
  { english: "red", french: "rouge", korean: "빨간색", difficulty: 1 },
  { english: "blue", french: "bleu", korean: "파란색", difficulty: 1 },
  { english: "green", french: "vert", korean: "초록색", difficulty: 1 },
  { english: "yellow", french: "jaune", korean: "노란색", difficulty: 1 },
  { english: "black", french: "noir", korean: "검은색", difficulty: 1 },
  { english: "white", french: "blanc", korean: "흰색", difficulty: 1 },
  { english: "orange", french: "orange", korean: "주황색", difficulty: 1 },
  { english: "purple", french: "violet", korean: "보라색", difficulty: 1 },
  { english: "pink", french: "rose", korean: "분홍색", difficulty: 1 },
  { english: "brown", french: "marron", korean: "갈색", difficulty: 1 },

  // TIME & DAYS (10 words)
  { english: "day", french: "jour", korean: "날", difficulty: 1 },
  { english: "night", french: "nuit", korean: "밤", difficulty: 1 },
  { english: "today", french: "aujourd'hui", korean: "오늘", difficulty: 1 },
  { english: "tomorrow", french: "demain", korean: "내일", difficulty: 1 },
  { english: "yesterday", french: "hier", korean: "어제", difficulty: 1 },
  { english: "week", french: "semaine", korean: "주", difficulty: 1 },
  { english: "month", french: "mois", korean: "월", difficulty: 1 },
  { english: "year", french: "an", korean: "년", difficulty: 1 },
  { english: "hour", french: "heure", korean: "시간", difficulty: 1 },
  { english: "minute", french: "minute", korean: "분", difficulty: 1 },

  // PLACES (10 words)
  { english: "house", french: "maison", korean: "집", difficulty: 1 },
  { english: "restaurant", french: "restaurant", korean: "식당", difficulty: 1 },
  { english: "school", french: "école", korean: "학교", difficulty: 1 },
  { english: "hospital", french: "hôpital", korean: "병원", difficulty: 1 },
  { english: "store", french: "magasin", korean: "가게", difficulty: 1 },
  { english: "city", french: "ville", korean: "도시", difficulty: 1 },
  { english: "country", french: "pays", korean: "나라", difficulty: 1 },
  { english: "airport", french: "aéroport", korean: "공항", difficulty: 2 },
  { english: "hotel", french: "hôtel", korean: "호텔", difficulty: 1 },
  { english: "park", french: "parc", korean: "공원", difficulty: 1 },

  // ADJECTIVES (10 words)
  { english: "good", french: "bon", korean: "좋은", difficulty: 1 },
  { english: "bad", french: "mauvais", korean: "나쁜", difficulty: 1 },
  { english: "big", french: "grand", korean: "큰", difficulty: 1 },
  { english: "small", french: "petit", korean: "작은", difficulty: 1 },
  { english: "hot", french: "chaud", korean: "뜨거운", difficulty: 1 },
  { english: "cold", french: "froid", korean: "차가운", difficulty: 1 },
  { english: "new", french: "nouveau", korean: "새로운", difficulty: 1 },
  { english: "old", french: "vieux", korean: "오래된", difficulty: 1 },
  { english: "happy", french: "heureux", korean: "행복한", difficulty: 1 },
  { english: "sad", french: "triste", korean: "슬픈", difficulty: 1 },

  // COMMON OBJECTS (10 words)
  { english: "book", french: "livre", korean: "책", difficulty: 1 },
  { english: "phone", french: "téléphone", korean: "전화", difficulty: 1 },
  { english: "car", french: "voiture", korean: "차", difficulty: 1 },
  { english: "table", french: "table", korean: "테이블", difficulty: 1 },
  { english: "chair", french: "chaise", korean: "의자", difficulty: 1 },
  { english: "door", french: "porte", korean: "문", difficulty: 1 },
  { english: "window", french: "fenêtre", korean: "창문", difficulty: 1 },
  { english: "computer", french: "ordinateur", korean: "컴퓨터", difficulty: 1 },
  { english: "money", french: "argent", korean: "돈", difficulty: 1 },
  { english: "key", french: "clé", korean: "열쇠", difficulty: 1 }
]

export async function GET() {
  try {
    // Initialize Supabase with service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check existing words
    const { data: existingWords } = await supabase
      .from('vocabulary_words')
      .select('english_word')

    const existingEnglishWords = new Set(
      existingWords?.map(w => w.english_word.toLowerCase()) || []
    )

    // Filter new words
    const newWords = vocabulary.filter(
      word => !existingEnglishWords.has(word.english.toLowerCase())
    )

    if (newWords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All words already exist in database',
        totalWords: existingWords?.length || 0,
        newWords: 0
      })
    }

    // Format for insertion
    const wordsToInsert = newWords.map(word => ({
      english_word: word.english,
      french_translation: word.french,
      korean_translation: word.korean,
      difficulty_level: word.difficulty
    }))

    // Insert words
    const { data, error } = await supabase
      .from('vocabulary_words')
      .insert(wordsToInsert)
      .select()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${data.length} new words!`,
      totalWords: (existingWords?.length || 0) + data.length,
      newWords: data.length,
      categories: {
        greetings: 10,
        verbs: 15,
        food: 15,
        numbers: 10,
        family: 10,
        colors: 10,
        time: 10,
        places: 10,
        adjectives: 10,
        objects: 10
      }
    })

  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed vocabulary' },
      { status: 500 }
    )
  }
}