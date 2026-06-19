import { Badge, User } from '../types';

export const ALL_BADGES: Badge[] = [
  {
    id: 'first_word',
    name: 'Kelime Avcısı',
    description: 'İlk kelimeni kütüphanene ekledin.',
    icon: 'star',
    color: 'bg-amber-400',
    requirement: 'save_1_word'
  },
  {
    id: 'vocab_master',
    name: 'Sözlük Ustası',
    description: '10 kelimeyi hafızana kazıdın.',
    icon: 'menu_book',
    color: 'bg-blue-500',
    requirement: 'save_10_words'
  },
  {
    id: 'early_bird',
    name: 'Erkenci Kuş',
    description: 'İlk günün dersini başarıyla tamamladın.',
    icon: 'wb_sunny',
    color: 'bg-orange-400',
    requirement: 'complete_day_1'
  },
  {
    id: 'streak_7',
    name: 'Yedi Tepe',
    description: '7 günlük disiplini korudun.',
    icon: 'local_fire_department',
    color: 'bg-red-500',
    requirement: 'complete_7_days'
  },
  {
    id: 'flashcard_pro',
    name: 'Hafıza Şampiyonu',
    description: 'Flashcard modunda bir antrenman yaptın.',
    icon: 'psychology',
    color: 'bg-purple-500',
    requirement: 'start_flashcards'
  },
  {
    id: 'level_ready',
    name: 'Yola Hazır',
    description: 'Seviyeni seçerek maceraya başladın.',
    icon: 'flag',
    color: 'bg-emerald-500',
    requirement: 'select_level'
  }
];

export const checkBadgeUnlocks = (user: User, savedWordsCount: number, currentDay: number): string[] => {
  const newBadges: string[] = [...(user.badges || [])];

  const addBadge = (id: string) => {
    if (!newBadges.includes(id)) {
      newBadges.push(id);
      return true;
    }
    return false;
  };

  // Logic for each badge
  if (savedWordsCount >= 1) addBadge('first_word');
  if (savedWordsCount >= 10) addBadge('vocab_master');
  if (user.level) addBadge('level_ready');
  if (user.completedDays?.includes(1) || currentDay > 1) addBadge('early_bird');
  if (currentDay >= 7) addBadge('streak_7');

  return newBadges;
};
