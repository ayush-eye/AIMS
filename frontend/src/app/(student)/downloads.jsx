import React, { useState } from 'react';
import { StyleSheet, View, Text, StatusBar, ScrollView, RefreshControl } from 'react-native';
import { Download } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';
import EmptyState from '../../components/EmptyState';

export default function DownloadsScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
      
      {/* Rounded Header Card */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerIconContainer}>
            <Download color={colors.textLight} size={24} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Downloads</Text>
            <Text style={styles.headerSubtitle}>Offline study notes and materials</Text>
          </View>
        </View>
      </View>

      {/* Empty State */}
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.navyPrimary}
          />
        }
      >
        <EmptyState
          icon="inbox"
          title="No downloads available"
          description="Notes and study materials you choose to save offline will appear here for offline reading without an active internet connection."
        />
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.five,
  },
  emptyCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.five,
    borderRadius: Spacing.three,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    ...colors.cardShadow,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: Spacing.three,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: Spacing.two,
    textAlign: 'center',
    lineHeight: 20,
  },
});
