import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface BreathingExerciseProps {
  pattern: 'inhale' | 'exhale' | 'hold';
  duration: number;
  onComplete?: () => void;
}

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({
  pattern,
  duration,
  onComplete,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: pattern === 'inhale' ? 1.5 : pattern === 'exhale' ? 0.8 : 1,
          duration: duration * 1000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: pattern === 'hold' ? 0.7 : 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished && onComplete) {
        onComplete();
      }
    });

    return () => animation.stop();
  }, [pattern, duration]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F0F8FF', '#E3F2FD', '#BBDEFB']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <BlurView intensity={20} tint="light" style={styles.blurContainer}>
          <View style={styles.contentContainer}>
            <Text style={styles.instructionText}>
              {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
            </Text>
            <Animated.View
              style={[
                styles.circle,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              <View style={styles.innerCircle} />
            </Animated.View>
            <Text style={styles.timerText}>{duration}s</Text>
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurContainer: {
    width: '90%',
    aspectRatio: 1,
    borderRadius: 25,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  instructionText: {
    fontSize: 36,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 30,
  },
  circle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  timerText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#1A1A1A',
    marginTop: 20,
  },
});
