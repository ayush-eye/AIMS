import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, RefreshControl, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, PlayCircle, ArrowLeft, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getChapters, getLectures } from '../../services/studentApi';
import { Spacing } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { ChapterCardSkeleton } from '../../components/SkeletonLoader';
import { getErrorMessage } from '../../services/api';

export default function ChapterDetailScreen() {
  const { courseId, courseTitle } = useLocalSearchParams();
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  
  const [chapters, setChapters] = useState([]);
  const [lecturesByChapter, setLecturesByChapter] = useState({});
  const [expandedChapterId, setExpandedChapterId] = useState(null);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lecturesLoading, setLecturesLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const fetchChapters = async () => {
    setError(null);
    try {
      const data = await getChapters(courseId);
      const sorted = (data || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setChapters(sorted);

      // Pre-fetch all lectures for all chapters in parallel for search & organization
      const tempLectures = {};
      const tempLoading = {};
      
      await Promise.all(
        sorted.map(async (chapter) => {
          tempLoading[chapter._id] = true;
          try {
            const lects = await getLectures(chapter._id);
            tempLectures[chapter._id] = lects || [];
          } catch (e) {
            console.error(`Error fetching lectures for chapter ${chapter._id}:`, e);
            tempLectures[chapter._id] = [];
          } finally {
            tempLoading[chapter._id] = false;
          }
        })
      );
      
      setLecturesByChapter(tempLectures);
      setLecturesLoading(tempLoading);
    } catch (err) {
      console.error('Error fetching chapters:', err);
      setError(getErrorMessage(err));
    } finally {
      setChaptersLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchChapters();
    }
  }, [courseId]);

  // Filter chapters and lectures based on search query
  const filteredChapters = chapters.filter(chapter => {
    if (!searchQuery.trim()) return true;
    
    const chapterMatches = chapter.title.toLowerCase().includes(searchQuery.toLowerCase());
    const lectures = lecturesByChapter[chapter._id] || [];
    const lectureMatches = lectures.some(lec => 
      lec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lec.description && lec.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    return chapterMatches || lectureMatches;
  });

  const getFilteredLectures = (chapterId) => {
    const lectures = lecturesByChapter[chapterId] || [];
    if (!searchQuery.trim()) return lectures;
    
    return lectures.filter(lec => 
      lec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lec.description && lec.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const firstMatchingChapter = chapters.find(chapter => {
        const lectures = lecturesByChapter[chapter._id] || [];
        return lectures.some(lec => 
          lec.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
      if (firstMatchingChapter) {
        setExpandedChapterId(firstMatchingChapter._id);
      }
    }
  }, [searchQuery]);

  const handleToggleChapter = async (chapterId) => {
    if (expandedChapterId === chapterId) {
      setExpandedChapterId(null);
      return;
    }

    setExpandedChapterId(chapterId);

    if (!lecturesByChapter[chapterId]) {
      setLecturesLoading(prev => ({ ...prev, [chapterId]: true }));
      try {
        const data = await getLectures(chapterId);
        setLecturesByChapter(prev => ({ ...prev, [chapterId]: data }));
      } catch (err) {
        console.error(`Error fetching lectures for chapter ${chapterId}:`, err);
      } finally {
        setLecturesLoading(prev => ({ ...prev, [chapterId]: false }));
      }
    }
  };

  const handleLecturePress = (lecture) => {
    router.push({
      pathname: '/(student)/lecture-player',
      params: { 
        lectureId: lecture._id, 
        lectureTitle: lecture.title,
        lectureDesc: lecture.description || '',
        videoUrl: lecture.videoUrl,
        chapterId: lecture.chapter
      }
    });
  };

  if (chaptersLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={colors.textLight} size={20} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{courseTitle}</Text>
            <Text style={styles.headerTitle}>Course Syllabus</Text>
          </View>
        </View>
        <View style={{ paddingTop: Spacing.four }}>
          <ChapterCardSkeleton />
          <ChapterCardSkeleton />
          <ChapterCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={colors.textLight} size={20} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{courseTitle}</Text>
            <Text style={styles.headerTitle}>Course Syllabus</Text>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ErrorState
            title="Syllabus Unavailable"
            message={error}
            onRetry={() => {
              setChaptersLoading(true);
              fetchChapters();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
      
      {/* Top Header Navigation */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft color={colors.textLight} size={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{courseTitle}</Text>
          <Text style={styles.headerTitle}>Course Syllabus</Text>
        </View>
      </View>

      {/* Modern Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBarWrapper}>
          <Search color="rgba(255, 255, 255, 0.7)" size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search chapters or lectures..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchChapters();
            }}
            tintColor={colors.navyPrimary}
          />
        }
      >
        {filteredChapters.length === 0 ? (
          <EmptyState
            icon="search"
            title={searchQuery.trim() ? "No matching syllabus items" : "Syllabus is empty"}
            description={searchQuery.trim() ? `We couldn't find any chapters or lectures matching "${searchQuery}".` : "No chapters or study materials have been uploaded to this course yet."}
          />
        ) : (
          filteredChapters.map((chapter, index) => {
            const isExpanded = expandedChapterId === chapter._id;
            const lectures = getFilteredLectures(chapter._id);
            const isLectLoading = lecturesLoading[chapter._id];
            const allLecturesCount = lecturesByChapter[chapter._id] ? lecturesByChapter[chapter._id].length : 0;

            return (
              <View 
                key={chapter._id} 
                style={styles.chapterCard}
              >
                {/* Accordion Header */}
                <TouchableOpacity
                  onPress={() => handleToggleChapter(chapter._id)}
                  activeOpacity={0.7}
                  style={styles.chapterHeader}
                >
                  <View style={styles.chapterHeaderLeft}>
                    <Text style={styles.chapterNumber}>
                      Chapter {index + 1}
                    </Text>
                    <Text style={styles.chapterTitle}>
                      {chapter.title}
                    </Text>
                    <Text style={styles.chapterSubtext}>
                      {isLectLoading 
                        ? 'Loading lectures...' 
                        : `${allLecturesCount} ${allLecturesCount === 1 ? 'lesson' : 'lessons'} available`}
                    </Text>
                  </View>
                  {isExpanded ? (
                    <ChevronUp color={colors.textSecondary} size={20} />
                  ) : (
                    <ChevronDown color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>

                {/* Accordion Body */}
                {isExpanded && (
                  <View style={styles.lecturesContainer}>
                    {isLectLoading ? (
                      <View style={styles.lecturesLoading}>
                        <ActivityIndicator size="small" color={colors.navyPrimary} />
                        <Text style={styles.lecturesLoadingText}>Loading lectures...</Text>
                      </View>
                    ) : lectures.length === 0 ? (
                      <View style={styles.emptyLectures}>
                        <Text style={styles.emptyLecturesText}>
                          {searchQuery.trim() ? "No matching lectures in this chapter." : "No lectures in this chapter."}
                        </Text>
                      </View>
                    ) : (
                      lectures.map((lecture) => (
                        <TouchableOpacity
                          key={lecture._id}
                          onPress={() => handleLecturePress(lecture)}
                          style={styles.lectureRow}
                        >
                          <PlayCircle color={colors.navyPrimary} size={22} style={styles.playIcon} />
                          <View style={styles.lectureInfo}>
                            <Text style={styles.lectureTitle}>
                              {lecture.title}
                            </Text>
                            {lecture.description ? (
                              <Text style={styles.lectureDesc} numberOfLines={1}>
                                {lecture.description}
                              </Text>
                            ) : null}
                          </View>
                          <Text style={styles.watchText}>Watch →</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.navyPrimary,
    marginTop: Spacing.three,
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: colors.navySecondary,
    backgroundColor: colors.navyPrimary,
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    marginRight: Spacing.three,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    color: colors.textLight,
    fontWeight: 'bold',
    fontSize: 18,
  },
  scrollContainer: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: Spacing.three,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: Spacing.half,
  },
  chapterCard: {
    backgroundColor: colors.background,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: Spacing.three,
    overflow: 'hidden',
    ...colors.cardShadow,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
  },
  chapterHeaderLeft: {
    flex: 1,
    marginRight: Spacing.three,
  },
  chapterNumber: {
    color: colors.accentBlue,
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  chapterTitle: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  chapterSubtext: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  lecturesContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.offWhite,
    padding: Spacing.two,
  },
  lecturesLoading: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lecturesLoadingText: {
    color: colors.textSecondary,
    marginTop: Spacing.two,
    fontSize: 12,
  },
  emptyLectures: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLecturesText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 14,
  },
  lectureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: colors.background,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playIcon: {
    marginRight: Spacing.three,
  },
  lectureInfo: {
    flex: 1,
    marginRight: Spacing.two,
  },
  lectureTitle: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  lectureDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  watchText: {
    color: colors.accentBlue,
    fontSize: 13,
    fontWeight: 'bold',
  },
  searchBarContainer: {
    backgroundColor: colors.navyPrimary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    ...colors.cardShadow,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 44,
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
  clearSearchText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
