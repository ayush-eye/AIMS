import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, ScrollView, Alert, Image, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { User, LogOut, Phone, Shield, BookOpen, UserCheck, Edit3, Save, X, Mail, MapPin, Sun, Moon, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '../../constants/theme';

import { getErrorMessage } from '../../services/api';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const { themeMode, selectThemeMode, colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setAddress(user.address || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      logout();
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out of AIM Institute?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: logout }
        ]
      );
    }
  };

  const handleSave = async () => {
    setError("");
    if (!firstName.trim() || !lastName.trim() || !address.trim()) {
      setError("First name, last name, and address are required.");
      return;
    }

    setUpdating(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim(),
        email: email.trim(),
      });
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (e) {
      console.error(e);
      setError(getErrorMessage(e));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />

      {/* Rounded Header Card */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerIconContainer}>
            <User color={colors.textLight} size={24} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Manage your student account & preferences</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Card */}
        <View style={[styles.profileCard, colors.cardShadow]}>
          <View style={styles.profileHeader}>
            <Image
              source={require("../../../assets/images/logo.jpg")}
              style={styles.profileAvatarLogo}
              resizeMode="contain"
            />
            <View style={styles.profileTextContainer}>
              <Text style={styles.profileHeading}>
                {user?.name || "Student User"}
              </Text>
              <Text style={styles.profileSubheading}>
                AIM Institute Learning Platform
              </Text>
            </View>
          </View>

          {/* User Details Display & Form */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {isEditing ? (
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter first name"
                  placeholderTextColor="#A0AEC0"
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    if (error) setError("");
                  }}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter last name"
                  placeholderTextColor="#A0AEC0"
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    if (error) setError("");
                  }}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError("");
                  }}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      height: 80, 
                      textAlignVertical: "top" 
                    }
                  ]}
                  placeholder="Enter complete address"
                  placeholderTextColor="#A0AEC0"
                  multiline
                  numberOfLines={3}
                  value={address}
                  onChangeText={(text) => {
                    setAddress(text);
                    if (error) setError("");
                  }}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={() => setIsEditing(false)}
                  style={styles.btnCancel}
                  disabled={updating}
                >
                  <X color={colors.textSecondary} size={18} />
                  <Text style={styles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  style={styles.btnSave}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Save color="#FFFFFF" size={18} />
                      <Text style={styles.btnSaveText}>Save</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.detailsContainer}>
                <View style={styles.detailsItem}>
                  <Phone color={colors.accentBlue} size={18} />
                  <View style={styles.detailsTextContainer}>
                    <Text style={styles.detailsLabel}>Mobile Number</Text>
                    <Text style={styles.detailsValue}>{user?.mobile || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailsItem}>
                  <Mail color={colors.accentBlue} size={18} />
                  <View style={styles.detailsTextContainer}>
                    <Text style={styles.detailsLabel}>Email Address</Text>
                    <Text style={styles.detailsValue}>{user?.email || 'Not Provided'}</Text>
                  </View>
                </View>

                <View style={styles.detailsItem}>
                  <MapPin color={colors.accentBlue} size={18} />
                  <View style={styles.detailsTextContainer}>
                    <Text style={styles.detailsLabel}>Address</Text>
                    <Text style={styles.detailsValue}>{user?.address || 'Not Provided'}</Text>
                  </View>
                </View>

                <View style={styles.detailsItem}>
                  <UserCheck color={colors.active} size={18} />
                  <View style={styles.detailsTextContainer}>
                    <Text style={styles.detailsLabel}>Account Status</Text>
                    <Text style={[styles.detailsValue, styles.statusActive]}>
                      {user?.status ? user.status.toUpperCase() : 'ACTIVE'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsItem}>
                  <Shield color={colors.textSecondary} size={18} />
                  <View style={styles.detailsTextContainer}>
                    <Text style={styles.detailsLabel}>Access Role</Text>
                    <Text style={[styles.detailsValue, styles.uppercase]}>
                      {user?.role || 'Student'}
                    </Text>
                  </View>
                </View>
                
                <View style={[styles.detailsItem, { borderBottomWidth: 0 }]}>
                  <BookOpen color={colors.textSecondary} size={18} />
                  <View style={styles.detailsTextContainer}>
                    <Text style={styles.detailsLabel}>Enrolled Courses</Text>
                    <Text style={styles.detailsValue}>
                      {user?.assignedCourses?.length || 0} Courses Enrolled
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={styles.editBtn}
                activeOpacity={0.8}
              >
                <Edit3 color={colors.accentBlue} size={18} />
                <Text style={styles.editBtnText}>Edit Profile Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Theme Settings Card */}
        <View style={[styles.profileCard, colors.cardShadow]}>
          <View style={styles.sectionHeader}>
            <Settings color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Customize the look and feel of the AIM application.
          </Text>

          <View style={styles.themeSwitcher}>
            <TouchableOpacity
              onPress={() => selectThemeMode("light")}
              style={[
                styles.themeBtn,
                themeMode === "light" ? styles.themeBtnActive : null
              ]}
            >
              <Sun color={themeMode === "light" ? colors.accentBlue : colors.textSecondary} size={16} />
              <Text style={[
                styles.themeBtnText,
                themeMode === "light" ? { color: colors.accentBlue, fontWeight: "bold" } : { color: colors.textSecondary }
              ]}>Light</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => selectThemeMode("dark")}
              style={[
                styles.themeBtn,
                themeMode === "dark" ? styles.themeBtnActive : null
              ]}
            >
              <Moon color={themeMode === "dark" ? colors.accentBlue : colors.textSecondary} size={16} />
              <Text style={[
                styles.themeBtnText,
                themeMode === "dark" ? { color: colors.accentBlue, fontWeight: "bold" } : { color: colors.textSecondary }
              ]}>Dark</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => selectThemeMode("system")}
              style={[
                styles.themeBtn,
                themeMode === "system" ? styles.themeBtnActive : null
              ]}
            >
              <Settings color={themeMode === "system" ? colors.accentBlue : colors.textSecondary} size={16} />
              <Text style={[
                styles.themeBtnText,
                themeMode === "system" ? { color: colors.accentBlue, fontWeight: "bold" } : { color: colors.textSecondary }
              ]}>System</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Button: Sign Out */}
        <TouchableOpacity
          onPress={handleLogoutPress}
          style={styles.logoutBtn}
          activeOpacity={0.85}
        >
          <LogOut color={colors.blocked} size={20} />
          <Text style={styles.logoutBtnText}>Sign Out Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    backgroundColor: colors.navyPrimary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: insets.top + Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    ...colors.cardShadow,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    marginRight: Spacing.three,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: colors.textLight,
    fontWeight: 'bold',
    fontSize: 20,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  scrollContainer: {
    padding: Spacing.four,
    paddingTop: Spacing.four,
  },
  profileCard: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.four,
    backgroundColor: colors.offWhite,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileAvatarLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: Spacing.three,
    backgroundColor: '#FFFFFF',
  },
  profileTextContainer: {
    flex: 1,
  },
  profileHeading: {
    fontWeight: 'bold',
    fontSize: 18,
    color: colors.text,
  },
  profileSubheading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailsContainer: {
    backgroundColor: colors.offWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.two,
  },
  detailsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.offWhite,
  },
  detailsTextContainer: {
    marginLeft: Spacing.three,
    flex: 1,
  },
  detailsLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  detailsValue: {
    fontWeight: '600',
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  statusActive: {
    color: colors.active,
    fontWeight: 'bold',
  },
  uppercase: {
    textTransform: 'uppercase',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    borderColor: colors.accentBlue,
    paddingVertical: 12,
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  editBtnText: {
    fontWeight: 'bold',
    fontSize: 15,
    color: colors.accentBlue,
  },
  formContainer: {
    gap: Spacing.three,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    color: colors.text,
    backgroundColor: colors.offWhite,
    borderColor: colors.border,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  btnCancel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Spacing.two,
    paddingVertical: 12,
    gap: Spacing.one,
  },
  btnCancelText: {
    fontWeight: 'bold',
    fontSize: 15,
    color: colors.textSecondary,
  },
  btnSave: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentBlue,
    borderRadius: Spacing.two,
    paddingVertical: 12,
    gap: Spacing.one,
  },
  btnSaveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: Spacing.three,
  },
  themeSwitcher: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: Spacing.one,
  },
  themeBtnActive: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  themeBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  logoutBtn: {
    backgroundColor: colors.isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
    borderWidth: 1,
    borderColor: colors.isDark ? 'rgba(239, 68, 68, 0.3)' : '#FEE2E2',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: Spacing.two,
    marginBottom: Spacing.six,
    gap: Spacing.two,
  },
  logoutBtnText: {
    color: colors.blocked,
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: colors.blocked,
    fontSize: 13,
    marginBottom: Spacing.three,
    fontWeight: '500',
  },
});
