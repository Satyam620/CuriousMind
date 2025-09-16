import { useState, useEffect } from 'react';
import { Animated } from 'react-native';

interface UseScreenAnimationOptions {
  fadeInDuration?: number;
  slideInDuration?: number;
  initialTranslateY?: number;
}

interface ScreenAnimationValues {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  buttonScale: Animated.Value;
  animateButtonPress: () => void;
}

/**
 * Custom hook for consistent screen entrance animations
 * Used across multiple screens to eliminate duplication
 */
export const useScreenAnimation = (
  options: UseScreenAnimationOptions = {}
): ScreenAnimationValues => {
  const {
    fadeInDuration = 800,
    slideInDuration = 600,
    initialTranslateY = 50
  } = options;

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(initialTranslateY));
  const [buttonScale] = useState(new Animated.Value(1));

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeInDuration,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: slideInDuration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, fadeInDuration, slideInDuration]);

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    fadeAnim,
    slideAnim,
    buttonScale,
    animateButtonPress,
  };
};