import { Ionicons } from '@expo/vector-icons';

/**
 * Unified category icon mapping function
 * Used across CategoryScreen and QuizConfig screens for consistency
 */
export const getCategoryIcon = (categoryName: string): keyof typeof Ionicons.glyphMap => {
  const name = categoryName.toLowerCase();

  // Specific individual icons for each category
  if (name.includes('general knowledge') || name === 'general') return 'school-outline';

  // Entertainment categories - more comprehensive matching
  if (name.includes('entertainment')) {
    if (name.includes('books') || name.includes('literature')) return 'library-outline';
    if (name.includes('film') || name.includes('movie')) return 'film-outline';
    if (name.includes('music')) return 'musical-notes-outline';
    if (name.includes('television') || name.includes('tv')) return 'tv-outline';
    if (name.includes('video games') || name.includes('games')) return 'game-controller-outline';
    if (name.includes('cartoon') || name.includes('animation')) return 'play';
    if (name.includes('comics') || name.includes('manga')) return 'bookmarks-outline';
    if (name.includes('board games')) return 'grid-outline';
    // Default entertainment icon for any other entertainment category
    return 'ticket-outline';
  }

  // Science categories
  if (name.includes('science')) {
    if (name.includes('nature')) return 'leaf-outline';
    if (name.includes('computer')) return 'laptop-outline';
    if (name.includes('mathematics')) return 'calculator-outline';
    if (name.includes('gadgets')) return 'phone-portrait-outline';
    return 'flask-outline';
  }

  // Other specific categories
  if (name.includes('sports')) return 'football-outline';
  if (name.includes('geography')) return 'earth-outline';
  if (name.includes('history')) return 'time-outline';
  if (name.includes('politics')) return 'flag-outline';
  if (name.includes('art')) return 'brush-outline';
  if (name.includes('celebrities')) return 'star-outline';
  if (name.includes('animals')) return 'paw-outline';
  if (name.includes('vehicles')) return 'car-outline';
  if (name.includes('mythology')) return 'moon-outline';

  // Additional fallback categories
  if (name.includes('anime') || name.includes('manga')) return 'bookmarks-outline';
  if (name.includes('books') || name.includes('literature')) return 'book-outline';
  if (name.includes('music')) return 'musical-notes-outline';
  if (name.includes('film') || name.includes('movie')) return 'film-outline';
  if (name.includes('television') || name.includes('tv')) return 'tv-outline';
  if (name.includes('video games') || name.includes('games')) return 'game-controller-outline';
  if (name.includes('comics')) return 'bookmarks-outline';
  if (name.includes('food') || name.includes('drink')) return 'restaurant-outline';
  if (name.includes('board games')) return 'grid-outline';

  return 'help-circle-outline';
};

/**
 * Unified category color function with theme support
 * Consolidates the different implementations across the app
 */
export const getCategoryColor = (categoryName: string, isDark: boolean = false): string => {
  // Special case for art category to match our custom styling
  if (categoryName.toLowerCase().includes('art')) {
    return isDark ? '#FF6B9D' : '#E91E63';
  }

  const lightColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#8395A7', '#3C6382', '#40407A', '#706FD3', '#F8B500',
  ];

  const darkColors = [
    '#FF8A8A', '#6CE5DC', '#66C7E8', '#B8DCC8', '#FFD574',
    '#FFB8F5', '#74B8FF', '#7F47E5', '#26E2E3', '#FFB863',
    '#A5B5C7', '#5C7BA2', '#605A9A', '#8F8CE3', '#FFB720',
  ];

  const colors = isDark ? darkColors : lightColors;

  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};