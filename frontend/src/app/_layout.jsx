import React, { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import {
  View,
  StyleSheet,
  StatusBar,
} from "react-native";

import { ThemeProvider, useAppTheme } from "../context/ThemeContext";
import CustomSplashScreen from "../components/CustomSplashScreen";

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [splashAnimationDone, setSplashAnimationDone] = useState(false);
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Enforce a minimum display time of 1.2 seconds for the custom splash screen
    const timer = setTimeout(() => {
      setMinimumTimeElapsed(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isMounted || loading) return;

    const inAdminGroup = segments[0] === "(admin)";
    const inStudentGroup = segments[0] === "(student)";
    const inPendingScreen = segments[0] === "pending";

    if (!user) {
      // Redirect to login if not authenticated and trying to access protected screens
      if (inAdminGroup || inStudentGroup || inPendingScreen) {
        router.replace("/");
      }
    } else {
      // User is authenticated
      if (user.role === "admin") {
        // Admins should go to the dashboard
        if (!inAdminGroup) {
          router.replace("/(admin)/dashboard");
        }
      } else {
        // Students
        if (user.status === "pending" || user.status === "blocked") {
          if (!inPendingScreen) {
            router.replace("/pending");
          }
        } else {
          // Active students - redirect to student panel
          if (!inStudentGroup) {
            router.replace("/(student)/courses");
          }
        }
      }
    }
  }, [user, loading, segments, isMounted]);

  // Check if navigation has completed redirection based on Auth state
  const isRedirectComplete = () => {
    if (loading) return false;
    const currentSegment = segments[0];
    if (!user) {
      // If not logged in, we are ready if we are on the root login or register screen
      return !currentSegment || currentSegment === "register";
    } else {
      // If logged in, we are ready if the segment matches user role/status
      if (user.role === "admin") {
        return currentSegment === "(admin)";
      } else {
        if (user.status === "pending" || user.status === "blocked") {
          return currentSegment === "pending";
        } else {
          return currentSegment === "(student)";
        }
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.offWhite}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        <Stack.Screen name="pending" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(student)" />
      </Stack>

      {!splashAnimationDone && (
        <CustomSplashScreen
          isReady={!loading && isMounted && minimumTimeElapsed && isRedirectComplete()}
          onAnimationComplete={() => setSplashAnimationDone(true)}
        />
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
