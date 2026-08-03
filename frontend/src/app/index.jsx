import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Image,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { Spacing } from "../constants/theme";
import { useRouter } from "expo-router";
import { getErrorMessage } from "../services/api";

export default function LoginScreen() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginMode, setLoginMode] = useState("student"); // "student" or "admin"
  
  const { login, loading } = useAuth();
  const { colors } = useAppTheme();

  const handleLogin = async () => {
    setError("");
    const digitsOnly = mobile.replace(/\D/g, "");
    if (digitsOnly.length !== 10) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }

    if (loginMode === "admin") {
      if (!password.trim()) {
        setError("Password is required for admin login.");
        return;
      }
      try {
        await login(`+91${digitsOnly}`, "admin", { password: password.trim() });
      } catch (e) {
        console.error(e);
        setError(getErrorMessage(e));
      }
    } else {
      // Student login
      try {
        const res = await login(`+91${digitsOnly}`, "student");
        if (res && res.requiresRegistration) {
          router.push({
            pathname: "/register",
            params: { mobile: `+91${digitsOnly}` },
          });
        }
      } catch (e) {
        console.error(e);
        setError(getErrorMessage(e));
      }
    }
  };

  const getCardTitle = () => {
    if (loginMode === "admin") return "Admin Authentication";
    return "Sign In or Register";
  };

  const getCardDescription = () => {
    if (loginMode === "admin") {
      return "Enter your registered admin mobile number and password to access the management portal.";
    }
    return "Enter your 10-digit mobile number to log in or register. Registered students get instant access to lectures and notes.";
  };

  const resetAllFields = (mode) => {
    setLoginMode(mode);
    setMobile("");
    setPassword("");
    setError("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.offWhite }]}
    >
      <StatusBar barStyle={colors.isDark ? "light-content" : "dark-content"} backgroundColor={colors.offWhite} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logo.jpg")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.appTitle, { color: colors.text }]}>AIM Institute</Text>
          <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>
            {loginMode === "admin" ? "Admin Management Portal" : "Student Learning Portal"}
          </Text>
        </View>

        {/* Portal Tabs Selector */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tabBtn, loginMode === "student" ? { backgroundColor: colors.accentBlue } : null]}
            onPress={() => resetAllFields("student")}
          >
            <Text style={[styles.tabBtnText, loginMode === "student" ? { color: colors.textLight, fontWeight: "bold" } : { color: colors.textSecondary }]}>
              Student Login
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabBtn, loginMode === "admin" ? { backgroundColor: colors.accentBlue } : null]}
            onPress={() => resetAllFields("admin")}
          >
            <Text style={[styles.tabBtnText, loginMode === "admin" ? { color: colors.textLight, fontWeight: "bold" } : { color: colors.textSecondary }]}>
              Admin Login
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }, colors.cardShadow]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{getCardTitle()}</Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            {getCardDescription()}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Mobile input field */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Mobile Number</Text>
            <View style={[
              styles.phoneInputRow,
              { backgroundColor: colors.offWhite, borderColor: colors.border },
              error ? styles.phoneInputRowError : null,
            ]}>
              <View style={[styles.prefixContainer, { backgroundColor: colors.isDark ? "#1E293B" : "#EDF2F7", borderRightColor: colors.border }]}>
                <Text style={[styles.prefixText, { color: colors.text }]}>+91</Text>
              </View>
              <TextInput
                style={[styles.phoneInput, { color: colors.text }]}
                placeholder={loginMode === "admin" ? "Enter Mobile Number" : "Enter Mobile Number"}
                placeholderTextColor="#A0AEC0"
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, "");
                  if (cleaned.length <= 10) {
                    setMobile(cleaned);
                  }
                  if (error) setError("");
                }}
                maxLength={10}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password field for admin */}
          {loginMode === "admin" && (
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
              <TextInput
                style={[styles.normalInput, { color: colors.text, backgroundColor: colors.offWhite, borderColor: colors.border }]}
                placeholder="Enter admin password"
                placeholderTextColor="#A0AEC0"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError("");
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.navyPrimary }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={styles.loginButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            AIM Institute Learning Platform • Powered by AIM Institute
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.four,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.two,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 14,
    marginTop: Spacing.half,
    fontWeight: "500",
  },
  tabsContainer: {
    flexDirection: "row",
    borderRadius: Spacing.two,
    padding: 4,
    marginBottom: Spacing.four,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: Spacing.one,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: Spacing.one,
  },
  cardDescription: {
    fontSize: 13,
    marginBottom: Spacing.four,
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: Spacing.three,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: Spacing.one,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: Spacing.two,
    overflow: "hidden",
  },
  phoneInputRowError: {
    borderColor: "#EF4444",
  },
  prefixContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRightWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  prefixText: {
    fontSize: 16,
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  normalInput: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: 14,
    fontSize: 16,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    marginBottom: Spacing.three,
    fontWeight: "500",
  },
  loginButton: {
    borderRadius: Spacing.two,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    marginTop: Spacing.two,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelLink: {
    alignItems: "center",
    marginTop: Spacing.two,
    paddingVertical: 8,
  },
  cancelLinkText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing.four,
  },
  footerText: {
    fontSize: 11,
  },
});
