import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { Spacing } from '../constants/theme';

export function SkeletonItem({ width = '100%', height = 20, borderRadius = 8, style }) {
  const { colors } = useAppTheme();
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const skeletonColor = colors.isDark ? '#334155' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: skeletonColor,
          opacity: animatedValue,
        },
        style,
      ]}
    />
  );
}

export function CourseCardSkeleton() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={[styles.leftAccent, { backgroundColor: colors.isDark ? '#334155' : '#CBD5E1' }]} />
      <View style={styles.cardInfo}>
        <View style={styles.headerRow}>
          <SkeletonItem width={70} height={18} borderRadius={4} />
          <SkeletonItem width={50} height={14} borderRadius={4} />
        </View>
        <SkeletonItem width="80%" height={22} borderRadius={6} style={{ marginTop: 8 }} />
        <SkeletonItem width="100%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
        <SkeletonItem width="60%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
        <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
          <SkeletonItem width={90} height={14} borderRadius={4} />
          <SkeletonItem width={80} height={16} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

export function StudentCardSkeleton() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.studentCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <SkeletonItem width={44} height={44} borderRadius={22} />
      <View style={styles.studentInfo}>
        <SkeletonItem width="60%" height={18} borderRadius={4} />
        <SkeletonItem width="40%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <SkeletonItem width={70} height={28} borderRadius={14} />
    </View>
  );
}

export function ChapterCardSkeleton() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.chapterCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={styles.chapterHeader}>
        <View style={{ flex: 1 }}>
          <SkeletonItem width={90} height={14} borderRadius={4} />
          <SkeletonItem width="75%" height={20} borderRadius={6} style={{ marginTop: 6 }} />
          <SkeletonItem width="50%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <SkeletonItem width={24} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function MetricCardSkeleton() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <SkeletonItem width={40} height={40} borderRadius={20} style={{ marginRight: Spacing.two }} />
      <View style={{ flex: 1 }}>
        <SkeletonItem width="70%" height={12} borderRadius={4} />
        <SkeletonItem width="40%" height={22} borderRadius={6} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function CourseListSkeleton({ count = 4 }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <CourseCardSkeleton key={index} />
      ))}
    </View>
  );
}

export function NoticeBannerSkeleton() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.noticeCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={styles.noticeTextContainer}>
        <SkeletonItem width={70} height={16} borderRadius={8} />
        <SkeletonItem width="85%" height={24} borderRadius={6} style={{ marginTop: 12 }} />
        <SkeletonItem width="60%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
        <SkeletonItem width={80} height={28} borderRadius={14} style={{ marginTop: 12 }} />
      </View>
      <View style={styles.noticeImagePlaceholder}>
        <SkeletonItem width="100%" height="100%" borderRadius={0} />
      </View>
    </View>
  );
}

export function CategoryCardSkeleton() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.categoryCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <SkeletonItem width="75%" height={18} borderRadius={4} />
      <View style={styles.categoryCardFooter}>
        <SkeletonItem width={36} height={36} borderRadius={18} />
        <SkeletonItem width={16} height={16} borderRadius={4} />
      </View>
    </View>
  );
}

export function CategoryGridSkeleton() {
  return (
    <View style={styles.categoriesGrid}>
      {Array.from({ length: 8 }).map((_, index) => (
        <CategoryCardSkeleton key={index} />
      ))}
    </View>
  );
}

export function ConnectSectionSkeleton() {
  const { colors } = useAppTheme();
  return (
    <View style={styles.connectGrid}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.connectTile}>
          <SkeletonItem width={48} height={48} borderRadius={14} style={{ marginBottom: Spacing.one }} />
          <SkeletonItem width={50} height={12} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

export function HomeSkeleton() {
  return (
    <View style={styles.homeSkeletonContainer}>
      {/* Notice Banner Skeleton */}
      <View style={styles.noticeSectionSkeleton}>
        <NoticeBannerSkeleton />
      </View>
      
      {/* Categories Grid Skeleton */}
      <View style={styles.categoriesSectionSkeleton}>
        <SkeletonItem width={180} height={20} borderRadius={4} style={{ marginBottom: Spacing.three }} />
        <CategoryGridSkeleton />
      </View>
      
      {/* Connect With Us Skeleton */}
      <View style={styles.connectSectionSkeleton}>
        <SkeletonItem width={140} height={20} borderRadius={4} style={{ marginBottom: Spacing.three }} />
        <ConnectSectionSkeleton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    borderRadius: Spacing.two,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 2,
  },
  leftAccent: {
    width: 6,
  },
  cardInfo: {
    flex: 1,
    padding: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    marginTop: Spacing.two,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    borderWidth: 1,
  },
  studentInfo: {
    flex: 1,
    marginLeft: Spacing.three,
  },
  chapterCard: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    padding: Spacing.four,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
  },
  noticeCard: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    overflow: 'hidden',
    borderWidth: 1,
    height: 160,
  },
  noticeTextContainer: {
    flex: 1.3,
    padding: Spacing.three,
    justifyContent: 'space-between',
  },
  noticeImagePlaceholder: {
    flex: 0.7,
    height: '100%',
  },
  categoryCard: {
    width: '48%',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    minHeight: 130,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  categoryCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.two,
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
  homeSkeletonContainer: {
    paddingBottom: Spacing.five,
  },
  noticeSectionSkeleton: {
    marginHorizontal: Spacing.four,
    marginTop: -Spacing.three,
    marginBottom: Spacing.four,
  },
  categoriesSectionSkeleton: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  connectSectionSkeleton: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
});

