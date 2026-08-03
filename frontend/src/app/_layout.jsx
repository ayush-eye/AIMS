import React, { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  StatusBar,
  Image,
} from "react-native";
import { Colors } from "../constants/theme";

import { ThemeProvider, useAppTheme } from "../context/ThemeContext";

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.navyPrimary} />
      </View>
    );
  }

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
