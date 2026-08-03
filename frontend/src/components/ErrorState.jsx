import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';
import { Spacing } from '../constants/theme';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'Unable to connect or fetch data. Please check your connection and try again.',
  onRetry,
  retryLabel = 'Try Again',
  isNetworkError = false,
  containerStyle,
}) {
  const { colors } = useAppTheme();
  const IconComponent = isNetworkError ? WifiOff : AlertTriangle;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.iconFrame, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
        <IconComponent size={40} color="#EF4444" strokeWidth={1.8} />
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

      {onRetry ? (
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <RefreshCw size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.retryBtnText}>{retryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.three,
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    elevation: 2,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  iconFrame: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
    borderWidth: 1.5,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    marginTop: Spacing.four,
    elevation: 2,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
