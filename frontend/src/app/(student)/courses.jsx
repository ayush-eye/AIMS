import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, StatusBar, useWindowDimensions, Linking, Alert, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCourses } from '../../services/studentApi';
import { Spacing } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, ChevronRight } from 'lucide-react-native';
import { FontAwesome } from '@expo/vector-icons';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { CourseListSkeleton, HomeSkeleton } from '../../components/SkeletonLoader';
import { getErrorMessage } from '../../services/api';

export default function CourseCatalogScreen() {
  useAuth();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const styles = getStyles(colors, insets, width);
  const router = useRouter();
  
  const categoriesList = [
    { id: '10th', title: 'CLASS 10TH', label: '10', color: '#D63031' },
    { id: '9th', title: 'CLASS 9TH', label: '9', color: '#EE5A24' },
    { id: '8th', title: 'CLASS 8TH', label: '8', color: '#833471' },
    { id: '7th', title: 'CLASS 7TH', label: '7', color: '#006266' },
    { id: '6th', title: 'CLASS 6TH', label: '6', color: '#1B1464' },
    { id: '5th', title: 'CLASS 5TH', label: '5', color: '#0C2461' },
    { id: 'free', title: 'FREE STUDY\nMATERIALS', isFree: true, label: 'FREE', color: '#00A8FF' },
    { id: 'all', title: 'ALL COURSES', isViewAll: true, label: 'ALL', color: '#1A5075' },
  ];

  const handleCategoryPress = (item) => {
    if (item.isFree) {
      router.push('/(student)/downloads');
    } else if (item.isViewAll) {
      router.push({
        pathname: '/(student)/category-courses',
        params: { category: 'all', categoryTitle: 'All Courses' }
      });
    } else {
      router.push({
        pathname: '/(student)/category-courses',
        params: { category: item.id, categoryTitle: `${item.title} Courses` }
      });
    }
  };
  
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Carousel slider state & configurations
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const cardWidth = width - (Spacing.four * 2); // Width matches parent containers with 24 horizontal margins on each side
  const carouselRef = useRef(null);

  const notices = [
    {
      id: 1,
      badge: 'Welcome',
      badgeColor: '#1A5075',
      title: 'WELCOME TO AIM INSTITUTE',
      sub: 'Shape your future with coaching classes',
      btnText: 'EXPLORE',
      action: null,
      image: require("../../../assets/images/welcome.png"),
      imageBg: '#EEF5FF',
      resizeMode: 'cover'
    },
    {
      id: 2,
      badge: 'Admissions',
      badgeColor: '#6C5CE7',
      title: 'ADMISSION OPEN NOW',
      sub: 'Call Admin: +91 8482954530',
      btnText: 'CALL NOW',
      action: () => Linking.openURL("tel:+918482954530").catch(() => Alert.alert("Call", "Calling +91 8482954530...")),
      image: require("../../../assets/images/logo.jpg"),
      imageBg: '#FFFFFF',
      resizeMode: 'contain'
    }
  ];

  const fetchCoursesData = async () => {
    setError(null);
    try {
      const data = await getCourses();
      setCourses(data || []);
      setFilteredCourses(data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCoursesData();
  }, []);

  useEffect(() => {
    let result = courses;

    if (searchQuery.trim()) {
      result = result.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredCourses(result);
  }, [searchQuery, courses]);

  const handleCoursePress = (course) => {
    router.push({
      pathname: '/(student)/chapter-detail',
      params: { courseId: course._id, courseTitle: course.title }
    });
  };

  const handleSocialPress = (platform, url) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Social Link", `Opening AIM Institute ${platform} page...`);
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
        <View style={styles.headerCard}>
          <View style={styles.navBarRow}>
            <TouchableOpacity style={styles.navIconBtn} onPress={() => router.push("/(student)/profile")}>
              <Menu color="#FFFFFF" size={24} />
            </TouchableOpacity>
            <Text style={styles.navBarTitle}>AIM Institute</Text>
            <TouchableOpacity style={styles.navIconBtn} onPress={() => Alert.alert("Notifications", "You have no new notifications.")}>
              <Bell color="#FFFFFF" size={22} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: Spacing.four }}>
          <HomeSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
        <View style={styles.headerCard}>
          <View style={styles.navBarRow}>
            <TouchableOpacity style={styles.navIconBtn} onPress={() => router.push("/(student)/profile")}>
              <Menu color="#FFFFFF" size={24} />
            </TouchableOpacity>
            <Text style={styles.navBarTitle}>AIM Institute</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ErrorState
            title="Unable to Load Courses"
            message={error}
            onRetry={() => {
              setLoading(true);
              fetchCoursesData();
            }}
          />
        </View>
      </View>
    );
  }

  const showCoursesList = searchQuery.trim() !== '';

  // Header Component for the FlatList to keep everything scrollable
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 1. Teal Rounded Header Card containing hamburger, notification, and profile */}
      <View style={styles.headerCard}>
        {/* Navigation Bar Row */}
        <View style={styles.navBarRow}>
          <TouchableOpacity style={styles.navIconBtn} onPress={() => router.push("/(student)/profile")}>
            <Menu color="#FFFFFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.navBarTitle}>AIM Institute</Text>
          <TouchableOpacity style={styles.navIconBtn} onPress={() => Alert.alert("Notifications", "You have no new notifications.")}>
            <Bell color="#FFFFFF" size={22} />
          </TouchableOpacity>
        </View>
      </View>

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
              activeOpacity={item.action ? 0.95 : 1}
              disabled={!item.action}
              onPress={item.action}
            >
              <View style={styles.noticeTextContainer}>
                <View style={[styles.noticeBadge, { backgroundColor: item.badgeColor || '#1E293B' }]}>
                  <Text style={styles.noticeBadgeText}>{item.badge}</Text>
                </View>
                <Text style={styles.noticeTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.noticeSub} numberOfLines={1}>{item.sub}</Text>
                <View style={[styles.noticeButton, !item.action && { opacity: 0.8 }]}>
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

      {/* 4. "What are you looking for?" Grid Section */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>What are you looking for?</Text>
        <View style={styles.categoriesGrid}>
          {categoriesList.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.categoryCard, { backgroundColor: item.color }]}
              activeOpacity={0.85}
              onPress={() => handleCategoryPress(item)}
            >
              <Text style={styles.categoryCardTitle}>{item.title}</Text>
              <View style={styles.categoryCardFooter}>
                <View style={styles.categoryCircle}>
                  {item.isFree ? (
                    <Text style={styles.categoryCircleBadge}>FREE</Text>
                  ) : item.isViewAll ? (
                    <Text style={[styles.categoryCircleText, { color: item.color, fontSize: 11 }]}>ALL</Text>
                  ) : (
                    <Text style={[styles.categoryCircleText, { color: item.color }]}>{item.label}</Text>
                  )}
                </View>
                <Text style={item.isViewAll ? [styles.categoryArrow, { fontSize: 14 }] : styles.categoryArrow}>➔</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 5. Connect With Us Section */}
      <View style={styles.connectSection}>
        <Text style={styles.sectionTitle}>Connect With Us</Text>
        <View style={styles.connectGrid}>
          
          {/* Youtube Link */}
          <TouchableOpacity 
            style={styles.connectTile}
            onPress={() => handleSocialPress('YouTube', 'https://www.youtube.com/@gauravbhave')}
          >
            <View style={[styles.connectIconFrame, { backgroundColor: '#FF0000' }]}>
              <FontAwesome name="youtube-play" color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.connectLabel}>Youtube</Text>
          </TouchableOpacity>

          {/* Whatsapp Link */}
          <TouchableOpacity 
            style={styles.connectTile}
            onPress={() => handleSocialPress('WhatsApp', 'https://wa.me/918482954530')}
          >
            <View style={[styles.connectIconFrame, { backgroundColor: '#25D366' }]}>
              <FontAwesome name="whatsapp" color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.connectLabel}>Whatsapp</Text>
          </TouchableOpacity>

          {/* Instagram Link */}
          <TouchableOpacity 
            style={styles.connectTile}
            onPress={() => handleSocialPress('Instagram', 'https://instagram.com/gaurav_bhave9011')}
          >
            <View style={[styles.connectIconFrame, { backgroundColor: '#E1306C' }]}>
              <FontAwesome name="instagram" color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.connectLabel}>Instagram</Text>
          </TouchableOpacity>

          {/* Group Link */}
          <TouchableOpacity 
            style={styles.connectTile}
            onPress={() => handleSocialPress('Telegram', 'https://t.me/+918482954530')}
          >
            <View style={[styles.connectIconFrame, { backgroundColor: '#0088CC' }]}>
              <FontAwesome name="telegram" color="#FFFFFF" size={24} />
            </View>
            <Text style={styles.connectLabel}>Group</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* Syllabus / Available Courses Title - conditionally shown */}
      {showCoursesList ? (
        <View style={styles.syllabusTitleRow}>
          <Text style={styles.sectionTitle}>
            Search Results ({filteredCourses.length})
          </Text>
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.resetFilterText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
      <FlatList
        data={showCoursesList ? filteredCourses : []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.coursesList}
        ListHeaderComponent={renderHeader}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchCoursesData();
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleCoursePress(item)}
            style={styles.courseCard}
            activeOpacity={0.8}
          >
            <View style={styles.courseLeftAccent} />
            <View style={styles.courseInfo}>
              <View style={styles.courseHeaderRow}>
                <View style={styles.subjectBadge}>
                  <Text style={styles.subjectBadgeText}>{item.subject || 'GENERAL'}</Text>
                </View>
                {item.code ? <Text style={styles.courseCodeText}>{item.code}</Text> : null}
              </View>
              <Text style={styles.courseTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.courseDescription} numberOfLines={2}>
                {item.description || 'Access class chapters, reference files, and study lectures.'}
              </Text>
              <View style={styles.courseFooter}>
                <Text style={styles.badgePremium}>AIM Institute</Text>
                <View style={styles.startLearningRow}>
                  <Text style={styles.startLearningText}>Start Learning</Text>
                  <ChevronRight color={colors.accentBlue} size={16} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          showCoursesList ? (
            <EmptyState
              icon="search"
              title="No courses match your query"
              description={`We couldn't find any courses matching "${searchQuery}". Try searching for class titles or clear the filter.`}
              actionLabel="Clear Search Filter"
              onAction={() => setSearchQuery('')}
            />
          ) : null
        }
      />
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
  },
  loadingText: {
    color: colors.navyPrimary,
    marginTop: Spacing.three,
    fontWeight: '600',
    fontSize: 16,
  },
  headerContainer: {
    backgroundColor: colors.offWhite,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  
  // 1. Teal Rounded Header Card
  headerCard: {
    backgroundColor: colors.navyPrimary,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: insets.top + Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    ...colors.cardShadow,
  },
  navBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  navIconBtn: {
    padding: Spacing.one,
  },
  navBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerClassText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: Spacing.two,
    borderRadius: 20,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 2. Notice Section (Admission Enquiry Call Banner)
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
    height: 160,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  noticeTextContainer: {
    flex: 1.3,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  noticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C5CE7',
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
    fontSize: 18,
    fontWeight: '800',
    color: '#0C2461',
    marginTop: 6,
  },
  noticeSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  noticeButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  noticeButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  noticeBannerImage: {
    flex: 0.7,
    height: '100%',
    backgroundColor: '#F3E8FF',
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

  // 3. Search Bar
  searchSection: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.three,
    height: 48,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: colors.border,
    ...colors.cardShadow,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    marginLeft: Spacing.two,
    height: '100%',
  },
  clearSearchBtn: {
    padding: Spacing.one,
  },
  clearSearchText: {
    color: colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 16,
  },

  // 4. "What are you looking for?" Grid Section
  categoriesSection: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  categoryCard: {
    width: '48%',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    minHeight: 130,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  categoryCardTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  categoryCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCircleText: {
    fontWeight: '900',
    fontSize: 16,
  },
  categoryCircleEmoji: {
    fontSize: 18,
  },
  categoryCircleBadge: {
    color: '#D63031',
    fontWeight: '950',
    fontSize: 10,
  },
  categoryArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // 5. Free Content Section
  freeContentSection: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  freeContentScroll: {
    paddingRight: Spacing.four,
  },
  freeContentCard: {
    backgroundColor: '#57606F',
    width: 140,
    height: 120,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  freeContentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeContentTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  freeContentFooter: {
    alignItems: 'flex-end',
  },
  freeContentArrow: {
    color: '#FFFFFF',
    fontSize: 16,
  },

  // 6. Connect With Us Section
  connectSection: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  connectGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectTile: {
    alignItems: 'center',
    flex: 1,
  },
  connectIconFrame: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    marginBottom: Spacing.one,
  },
  connectLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  syllabusTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  resetFilterText: {
    color: colors.accentBlue,
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Course syllabus list
  coursesList: {
    paddingBottom: Spacing.five,
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: Spacing.two,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...colors.cardShadow,
  },
  courseLeftAccent: {
    width: 6,
    backgroundColor: '#1A5075',
  },
  courseInfo: {
    flex: 1,
    padding: Spacing.three,
  },
  courseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subjectBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#008DDA',
  },
  courseCodeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.two,
  },
  courseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
  badgePremium: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.accentBlue,
    letterSpacing: 0.5,
  },
  startLearningRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startLearningText: {
    color: colors.accentBlue,
    fontWeight: 'bold',
    fontSize: 13,
    marginRight: 2,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: Spacing.two,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: Spacing.one,
    textAlign: 'center',
  },
  expandToggleBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Spacing.two,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    marginHorizontal: Spacing.one,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  expandToggleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.accentBlue,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 44,
    marginTop: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: Spacing.two,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
});
