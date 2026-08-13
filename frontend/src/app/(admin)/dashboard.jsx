import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  StatusBar,
  useWindowDimensions,
  Alert,
  Linking,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import api from "../../services/api";
import { Spacing } from "../../constants/theme";
import { useAppTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import { MetricCardSkeleton, StudentCardSkeleton } from "../../components/SkeletonLoader";
import { BookOpen, Users, UserCheck, ShieldAlert } from "lucide-react-native";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const styles = getStyles(colors, insets, width);
  const router = useRouter();
  
  // Local profile options modal state
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  
  // Carousel slider state & configurations for 2 slides
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const cardWidth = width - 48; // Width matches parent containers with 24 horizontal margins on each side
  const carouselRef = React.useRef(null);

  const notices = [
    {
      id: 1,
      badge: 'System Info',
      badgeColor: '#1E293B',
      title: 'NEW SYSTEM MODULES READY',
      sub: 'Review student enrollments & curriculum',
      btnText: 'REVIEW USERS',
      action: () => router.push("/(admin)/students"),
      image: require("../../../assets/images/welcome.png"),
      imageBg: '#EEF5FF',
      resizeMode: 'cover'
    },
    {
      id: 2,
      badge: 'Call Support',
      badgeColor: '#6C5CE7',
      title: '📞 +91 8482954530',
      sub: 'For system help & support helpline',
      btnText: 'CALL NOW',
      action: () => Linking.openURL("tel:+918482954530").catch(() => Alert.alert("Call", "Calling +91 8482954530...")),
      image: require("../../../assets/images/logo.jpg"),
      imageBg: '#FFFFFF',
      resizeMode: 'contain'
    }
  ];

  const handleProfileOption = (optionName) => {
    setProfileModalVisible(false);
    Alert.alert(
      optionName,
      `AIM Institute ${optionName} feature will be available in the next version.`,
    );
  };

  const [students, setStudents] = useState([]);
  const [coursesCount, setCoursesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setError(null);
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        api.get("/api/admin/students"),
        api.get("/courses"),
      ]);
      setStudents(studentsRes.data || []);
      setCoursesCount((coursesRes.data || []).length);
    } catch (e) {
      console.error("Error fetching dashboard data:", e);
      setError("Failed to sync dashboard metrics. Please check network connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleApprove = async (userId) => {
    try {
      await api.patch("/api/admin/approve", { userId });
      setStudents((prev) =>
        prev.map((s) => (s._id === userId ? { ...s, status: "active" } : s)),
      );
    } catch (e) {
      console.error("Error approving student:", e);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.avatarContainer} />
            <View style={styles.profileTextWrapper}>
              <Text style={styles.headerNameText}>Loading Dashboard...</Text>
            </View>
          </View>
        </View>
        <View style={{ padding: Spacing.four, gap: Spacing.three }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </View>
          <StudentCardSkeleton />
          <StudentCardSkeleton />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.avatarContainer} />
            <View style={styles.profileTextWrapper}>
              <Text style={styles.headerNameText}>AIM Admin Dashboard</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ErrorState
            title="Dashboard Sync Failed"
            message={error}
            onRetry={() => {
              setLoading(true);
              fetchDashboardData();
            }}
          />
        </View>
      </View>
    );
  }

  const pendingStudents = students.filter((s) => s.status === "pending");
  const activeStudents = students.filter((s) => s.status === "active").length;
  const blockedStudents = students.filter((s) => s.status === "blocked").length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 1. Teal Rounded Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.avatarContainer}
              activeOpacity={0.8}
              onPress={() => setProfileModalVisible(true)}
            >
              <Image
                source={require("../../../assets/images/logo.jpg")}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <View style={styles.profileTextWrapper}>
              <Text style={styles.headerNameText} numberOfLines={1}>
                {user?.name || "AIM Admin"}
              </Text>
              <Text style={styles.headerClassText} numberOfLines={1}>
                Role: Administrator
              </Text>
            </View>
          </View>
        </View>

        {/* 2. System/Notice Updates Slideshow Banner */}
        <View style={styles.noticeSection}>
          <FlatList
            ref={carouselRef}
            data={notices}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.noticeCard, { width: cardWidth }]}
                activeOpacity={0.95}
                onPress={item.action}
              >
                <View style={styles.noticeTextContainer}>
                  <View style={[styles.noticeBadge, { backgroundColor: item.badgeColor || '#1E293B' }]}>
                    <Text style={styles.noticeBadgeText}>{item.badge}</Text>
                  </View>
                  <Text style={styles.noticeTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.noticeSub} numberOfLines={1}>{item.sub}</Text>
                  <View style={styles.noticeButton}>
                    <Text style={styles.noticeButtonText}>{item.btnText}</Text>
                  </View>
                </View>
                <Image
                  source={item.image}
                  style={[styles.noticeBannerImage, { backgroundColor: item.imageBg }]}
                  resizeMode={item.resizeMode || 'cover'}
                />
              </TouchableOpacity>
            )}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / cardWidth
              );
              setCurrentSlideIndex(index);
            }}
          />

          {/* Carousel Dots indicator */}
          <View style={styles.dotsContainer}>
            {notices.map((_, dotIndex) => (
              <View
                key={dotIndex}
                style={[
                  styles.carouselDot,
                  dotIndex === currentSlideIndex ? styles.carouselDotActive : null
                ]}
              />
            ))}
          </View>
        </View>

        {/* 3. Metrics Grid (Styled as outline cards with circular icon backdrops like assignments screen) */}
        <View style={styles.metricsGridSection}>
          <Text style={styles.sectionTitle}>Dashboard Statistics</Text>
          <View style={styles.metricsGrid}>
            
            {/* Total Courses Metric */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconFrame, { backgroundColor: '#EEF5FF' }]}>
                <BookOpen color="#008DDA" size={20} />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>Total Courses</Text>
                <Text style={styles.metricValue}>{coursesCount}</Text>
              </View>
            </View>

            {/* Active Students Metric */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconFrame, { backgroundColor: '#EBFDF5' }]}>
                <Users color="#10B981" size={20} />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>Active Students</Text>
                <Text style={[styles.metricValue, { color: colors.active }]}>{activeStudents}</Text>
              </View>
            </View>

            {/* Awaiting Approvals Metric */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconFrame, { backgroundColor: '#FFFBEB' }]}>
                <UserCheck color="#F59E0B" size={20} />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>Awaiting Approval</Text>
                <Text style={[styles.metricValue, { color: colors.pending }]}>{pendingStudents.length}</Text>
              </View>
            </View>

            {/* Blocked Students Metric */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconFrame, { backgroundColor: '#FEF2F2' }]}>
                <ShieldAlert color="#EF4444" size={20} />
              </View>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>Blocked Students</Text>
                <Text style={[styles.metricValue, { color: colors.blocked }]}>{blockedStudents}</Text>
              </View>
            </View>

          </View>
        </View>

        {/* 4. Quick Actions (Styled as colorful solid tiles matching Student "My Subjects") */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            
            {/* Action: Manage Students */}
            <TouchableOpacity
              style={[styles.actionTile, { width: (width - Spacing.four * 2 - Spacing.three) / 2 }]}
              onPress={() => router.push("/(admin)/students")}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.actionIconText}>👥</Text>
              </View>
              <Text style={styles.actionTileLabel}>Manage Students</Text>
            </TouchableOpacity>

            {/* Action: Course Builder */}
            <TouchableOpacity
              style={[styles.actionTile, { width: (width - Spacing.four * 2 - Spacing.three) / 2 }]}
              onPress={() => router.push("/(admin)/curriculum")}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#9C27B0' }]}>
                <Text style={styles.actionIconText}>📚</Text>
              </View>
              <Text style={styles.actionTileLabel}>Course Builder</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* 5. Pending Approvals list */}
        <View style={styles.pendingSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Pending Approvals ({pendingStudents.length})
            </Text>
            <TouchableOpacity onPress={() => router.push("/(admin)/students")}>
              <Text style={styles.viewAllBtnText}>View All</Text>
            </TouchableOpacity>
          </View>

          {pendingStudents.length === 0 ? (
            <EmptyState
              icon="users"
              title="No Pending Approvals"
              description="All student registrations have been reviewed and approved."
              containerStyle={{ paddingVertical: Spacing.three }}
            />
          ) : (
            pendingStudents.slice(0, 5).map((student) => (
              <View key={student._id} style={styles.studentRow}>
                <View style={{ flex: 1, marginRight: Spacing.two }}>
                  <Text style={styles.studentMobile} numberOfLines={1}>
                    {student.name ? `${student.name} (${student.mobile})` : student.mobile}
                  </Text>
                  <Text style={styles.studentSubtext} numberOfLines={1}>
                    {student.address ? `Address: ${student.address}` : `Role: ${student.role}`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(student._id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile Options</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setProfileModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.profileCard}>
                <Image
                  source={require("../../../assets/images/logo.jpg")}
                  style={styles.profileAvatarLargeImage}
                  resizeMode="contain"
                />
                <Text style={styles.profileMobileText}>{user?.mobile}</Text>
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>ADMINISTRATOR</Text>
                </View>
              </View>

              <View style={styles.optionsList}>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleProfileOption("Account Settings")}
                >
                  <Text style={styles.optionIcon}>⚙️</Text>
                  <Text style={styles.optionLabel}>Account Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleProfileOption("Security & Privacy")}
                >
                  <Text style={styles.optionIcon}>🛡️</Text>
                  <Text style={styles.optionLabel}>Security & Privacy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleProfileOption("Help & Support")}
                >
                  <Text style={styles.optionIcon}>📞</Text>
                  <Text style={styles.optionLabel}>Help & Support</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.logoutActionBtn}
                onPress={() => {
                  setProfileModalVisible(false);
                  logout();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutActionBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors, insets, width) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.offWhite,
  },
  scrollContainer: {
    paddingBottom: Spacing.six,
  },
  
  // 1. Teal Header Card Style
  headerCard: {
    backgroundColor: colors.navyPrimary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: insets.top + Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    ...colors.cardShadow,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileTextWrapper: {
    flex: 1,
    marginLeft: Spacing.three,
    justifyContent: 'center',
  },
  headerNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerClassText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: Spacing.two,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 2. Notice Section Slider
  noticeSection: {
    marginHorizontal: Spacing.four,
    marginTop: -Spacing.three,
    marginBottom: Spacing.three,
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.three,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    height: 136,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  noticeTextContainer: {
    flex: 1.2,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  noticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  noticeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A5075',
    marginTop: 6,
  },
  noticeSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  noticeButton: {
    backgroundColor: '#008DDA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  noticeButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noticeBannerImage: {
    flex: 0.8,
    height: '100%',
    backgroundColor: '#EEF5FF',
  },
  noticeBannerImageFull: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
    gap: 6,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  carouselDotActive: {
    width: 18,
    backgroundColor: '#1A5075',
  },

  // 3. Metrics grid
  metricsGridSection: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...colors.cardShadow,
  },
  metricIconFrame: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "600",
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 2,
  },

  // 4. Quick Actions colorful tiles
  actionsSection: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: Spacing.three,
  },
  actionTile: {
    backgroundColor: colors.background,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
    elevation: 2,
  },
  actionIconText: {
    fontSize: 20,
  },
  actionTileLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.text,
  },

  // Pending Approvals list styling
  pendingSection: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: Spacing.three,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAllBtnText: {
    fontSize: 14,
    color: colors.accentBlue,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: colors.background,
    borderRadius: Spacing.two,
    padding: Spacing.four,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...colors.cardShadow,
  },
  emptyCardText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  studentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: colors.border,
    ...colors.cardShadow,
  },
  studentMobile: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  studentSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  approveBtn: {
    backgroundColor: colors.active,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
  },
  approveBtnText: {
    color: colors.textLight,
    fontWeight: "bold",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
    width: "100%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: Spacing.two,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  closeBtn: {
    padding: Spacing.one,
  },
  closeBtnText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  modalBody: {
    paddingVertical: Spacing.four,
    alignItems: "center",
  },
  profileCard: {
    alignItems: "center",
    marginBottom: Spacing.five,
  },
  profileAvatarLargeImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.three,
  },
  profileMobileText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: Spacing.one,
  },
  adminBadge: {
    backgroundColor: "rgba(0, 141, 218, 0.1)",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.accentBlue,
    letterSpacing: 1,
  },
  optionsList: {
    alignSelf: "stretch",
    backgroundColor: colors.offWhite,
    borderRadius: Spacing.two,
    padding: Spacing.one,
    marginBottom: Spacing.five,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: Spacing.three,
  },
  optionIcon: {
    fontSize: 18,
  },
  optionLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
  },
  logoutActionBtn: {
    alignSelf: "stretch",
    backgroundColor: colors.blocked,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutActionBtnText: {
    color: colors.textLight,
    fontWeight: "bold",
    fontSize: 16,
  },
});
