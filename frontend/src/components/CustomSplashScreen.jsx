import React, { useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useAppTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function CustomSplashScreen({ isReady, onAnimationComplete }) {
  const { colors } = useAppTheme();
  
  // Animation values initialized safely for React render phase
  const [containerOpacity] = useState(() => new Animated.Value(1));
  const [logoScale] = useState(() => new Animated.Value(0.8));
  const [logoOpacity] = useState(() => new Animated.Value(0));
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    // 1. Entrance animation: Fade in logo and scale up slightly
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Idle animation: Gentle pulsing effect while loading
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isReady) {
      // 3. Exit animation: Fade out entire screen and scale logo up
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  // Use standard branding colors if theme colors are loading, otherwise theme-based backgrounds
  const backgroundColor = colors.isDark ? "#0B192C" : "#208AEF";

  return (
    <Modal
      transparent={true}
      animationType="none"
      visible={true}
      statusBarTranslucent={true}
    >
      <Animated.View style={[styles.container, { backgroundColor, opacity: containerOpacity }]}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: Animated.multiply(logoScale, pulseAnim) }
              ]
            }
          ]}
        >
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
            style={styles.loader}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    maxWidth: 180,
    maxHeight: 180,
    borderRadius: 36,
  },
  loader: {
    marginTop: 35,
  },
});
