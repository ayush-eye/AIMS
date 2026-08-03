import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, StatusBar, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCourses } from '../../services/studentApi';
import { Spacing } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { CourseListSkeleton } from '../../components/SkeletonLoader';
import { getErrorMessage } from '../../services/api';

export default function CategoryCoursesScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const styles = getStyles(colors, insets, width);
  const router = useRouter();
  const { category, categoryTitle } = useLocalSearchParams();

  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCoursesData = async () => {
    setError(null);
    try {
      const data = await getCourses();
      setCourses(data || []);
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

    const checkMatch = (title, code, term) => {
      const t = title ? title.toLowerCase() : '';
      const c = code ? code.toLowerCase() : '';
      return t.includes(`${term}th`) || 
             t.includes(`class ${term}`) || 
             t.includes(`class${term}`) || 
             t.includes(` ${term} `) || 
             t.startsWith(`${term} `) || 
             t.endsWith(` ${term}`) || 
             c.includes(term);
    };

    // Filter by category
    if (category !== 'all') {
      const termMap = {
        '5th': '5',
        '6th': '6',
        '7th': '7',
        '8th': '8',
        '9th': '9',
        '10th': '10'
      };
      const term = termMap[category];
      result = result.filter(c => {
        if (c.grade) {
          return c.grade === category;
        }
        return term ? checkMatch(c.title, c.code, term) : true;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      result = result.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredCourses(result);
  }, [searchQuery, category, courses]);

  const handleCoursePress = (course) => {
    router.push({
      pathname: '/(student)/chapter-detail',
      params: { courseId: course._id, courseTitle: course.title }
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft color="#FFFFFF" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {categoryTitle || 'Courses'}
            </Text>
            <View style={{ width: 24 }} />
          </View>
        </View>
        <View style={{ paddingTop: Spacing.three }}>
          <CourseListSkeleton count={4} />
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
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft color="#FFFFFF" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {categoryTitle || 'Courses'}
            </Text>
            <View style={{ width: 24 }} />
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ErrorState
            title="Failed to Load Courses"
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
      
      {/* Header Bar */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#FFFFFF" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {categoryTitle || 'Courses'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search color={colors.textSecondary} size={20} />
          <TextInput
            placeholder="Search subjects or courses..."
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.trim() ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Courses List */}
      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.coursesList}
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
          searchQuery.trim() ? (
            <EmptyState
              icon="search"
              title="No matching courses"
              description={`No courses matching "${searchQuery}" in ${categoryTitle || 'this category'}.`}
              actionLabel="Clear Search"
              onAction={() => setSearchQuery('')}
            />
          ) : (
            <EmptyState
              icon="course"
              title="No courses assigned"
              description={`There are currently no courses available in ${categoryTitle || 'this category'}. Please check back later or contact AIM Institute.`}
            />
          )
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
  headerCard: {
    backgroundColor: colors.navyPrimary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: insets.top + Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    ...colors.cardShadow,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: Spacing.one,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.two,
  },
  searchSection: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
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
  coursesList: {
    paddingTop: Spacing.two,
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
});
