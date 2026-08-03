import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { BookOpen, FolderOpen, Inbox, Search, Users, AlertCircle, RefreshCw } from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';
import { Spacing } from '../constants/theme';

const ICON_MAP = {
  course: BookOpen,
  folder: FolderOpen,
  inbox: Inbox,
  search: Search,
  users: Users,
  alert: AlertCircle,
};

export default function EmptyState({
  icon = 'course',
  customIcon,
  title = 'No items found',
  description = 'There are no items to display at this moment.',
  actionLabel,
  onAction,
  containerStyle,
}) {
  const { colors } = useAppTheme();
  const IconComponent = customIcon || ICON_MAP[icon] || BookOpen;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.iconFrame, { backgroundColor: colors.accentLight, borderColor: `${colors.accentBlue}30` }]}>
        <IconComponent size={44} color={colors.accentBlue} strokeWidth={1.8} />
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>

      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.navyPrimary }]}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <RefreshCw size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.five,
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.three,
  },
  iconFrame: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.one,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    marginTop: Spacing.four,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
