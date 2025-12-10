'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface VocabCatProps {
  happiness: number; // 0-100
  className?: string;
}

type CatMood = 'happy' | 'neutral' | 'sad' | 'angry';

export default function VocabCat({ happiness, className = '' }: VocabCatProps) {
  const [currentMood, setCurrentMood] = useState<CatMood>('neutral');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    let newMood: CatMood;
    
    if (happiness >= 75) {
      newMood = 'happy';
    } else if (happiness >= 50) {
      newMood = 'neutral';
    } else if (happiness >= 25) {
      newMood = 'sad';
    } else {
      newMood = 'angry';
    }

    if (newMood !== currentMood) {
      setIsTransitioning(true);
      setCurrentMood(newMood);
      setTimeout(() => setIsTransitioning(false), 600);
    }
  }, [happiness, currentMood]);

  const getMoodAnimation = () => {
    switch (currentMood) {
      case 'happy':
        return 'animate-happy-bounce';
      case 'sad':
        return 'animate-sad-sway';
      default:
        return '';
    }
  };

  const getMoodEmoji = () => {
    switch (currentMood) {
      case 'happy': return '😸';
      case 'neutral': return '😺';
      case 'sad': return '😿';
      case 'angry': return '😾';
    }
  };

  const getMoodTitle = () => {
    switch (currentMood) {
      case 'happy': return 'Thrilled!';
      case 'neutral': return 'Content';
      case 'sad': return 'Worried';
      case 'angry': return 'Very Upset!';
    }
  };

  const getMoodMessage = () => {
    switch (currentMood) {
      case 'happy': 
        return "Both of you are doing amazing! Keep it up! 🎉";
      case 'neutral': 
        return "Good progress! Keep studying together! 📚";
      case 'sad': 
        return "Your cat misses you both... Time to study! ⏰";
      case 'angry': 
        return "Your cat is very unhappy! Study together now! 🚨";
    }
  };

  const getHappinessColor = () => {
    if (happiness >= 75) return 'from-green-400 to-green-500';
    if (happiness >= 50) return 'from-yellow-400 to-yellow-500';
    if (happiness >= 25) return 'from-orange-400 to-orange-500';
    return 'from-red-400 to-red-500';
  };

  return (
    <div className={`vocab-cat-container ${className}`}>
      {/* Cat Animation Container */}
      <div 
        className={`relative w-full mx-auto ${isTransitioning ? getMoodAnimation() : ''}`}
        style={{ maxWidth: '350px', aspectRatio: '3 / 4' }}
      >
        {/* Body and Tail - Full size */}
        <div className="absolute inset-0">
          {/* Tail Layer (behind, with animation) */}
          <div 
            className="absolute inset-0 animate-tail-wag" 
            style={{ transformOrigin: 'center 30%' }}
          >
            <Image
              src="/images/cat/tail.png"
              alt="Cat tail"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Body Layer */}
          <div className="absolute inset-0">
            <Image
              src="/images/cat/body.png"
              alt="Cat body"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Face Layers - Positioned on the head area (top 40% of body) */}
        <div 
          className="absolute left-1/2 -translate-x-1/2"
          style={{ 
            top: '5%',
            width: '60%',
            aspectRatio: '1 / 1'
          }}
        >
          {/* Happy Face */}
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${
              currentMood === 'happy' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src="/images/cat/face-happy.png"
              alt="Happy face"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Neutral Face */}
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${
              currentMood === 'neutral' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src="/images/cat/face-neutral.png"
              alt="Neutral face"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Sad Face */}
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${
              currentMood === 'sad' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src="/images/cat/face-sad.png"
              alt="Sad face"
              fill
              className="object-contain"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          </div>

          {/* Angry Face */}
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${
              currentMood === 'angry' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src="/images/cat/face-angry.png"
              alt="Angry face"
              fill
              className="object-contain"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          </div>
        </div>
      </div>

      {/* Mood Display */}
      <div className="text-center mt-6 space-y-3">
        <div className="text-xl font-bold text-gray-800">
          <span className="text-2xl mr-2">{getMoodEmoji()}</span>
          {getMoodTitle()}
        </div>
        
        <div className="max-w-xs mx-auto">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">Happiness</span>
            <span className="font-bold">{happiness}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${getHappinessColor()}`}
              style={{ width: `${happiness}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-gray-600 max-w-xs mx-auto leading-relaxed">
          {getMoodMessage()}
        </p>
      </div>
    </div>
  );
}