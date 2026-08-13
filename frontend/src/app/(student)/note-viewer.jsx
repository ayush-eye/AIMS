import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Shield } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing } from '../../constants/theme';
import { useAppTheme } from '../../context/ThemeContext';

const DOCUMENT_PROTECTION_JS = `
  (function() {
    // 1. Disable text selection and touch callouts
    const style = document.createElement('style');
    style.innerHTML = ' \\
      * { \\
        -webkit-touch-callout: none !important; \\
        -webkit-user-select: none !important; \\
        user-select: none !important; \\
      } \\
    ';
    document.head.appendChild(style);

    // 2. Disable context menu & copy/cut
    window.addEventListener('contextmenu', function(e) { e.preventDefault(); }, true);
    document.addEventListener('contextmenu', function(e) { e.preventDefault(); }, true);
    window.addEventListener('copy', function(e) { e.preventDefault(); }, true);
    window.addEventListener('cut', function(e) { e.preventDefault(); }, true);

    // 3. Hide Google Drive sharing/downloading tools
    function hideElements() {
      const selectors = [
        '[role="toolbar"]',
        '[class*="chrome-top"]',
        '[class*="viewer-chrome-top"]',
        '[class*="ndfHFb-c43Zrf-V173Ib"]',
        '[class*="ndfHFb-c43Zrf-RZn5ee"]',
        '[aria-label*="Download"]',
        '[aria-label*="download"]',
        '[aria-label*="Print"]',
        '[aria-label*="print"]',
        '[aria-label*="Pop-out"]',
        '[aria-label*="pop-out"]',
        '[aria-label*="Open in new"]',
        '[aria-label*="Share"]',
        '[aria-label*="share"]',
        '[data-tooltip*="Download"]',
        '[data-tooltip*="Print"]',
        '[data-tooltip*="Pop-out"]',
        '[data-tooltip*="Open in new"]'
      ];
      selectors.forEach(function(selector) {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(function(el) {
            if (el && el.style.display !== 'none') {
              el.style.setProperty('display', 'none', 'important');
            }
          });
        } catch (e) {}
      });
    }

    hideElements();
    const interval = setInterval(hideElements, 150);
    setTimeout(function() { clearInterval(interval); }, 15000); // Check for 15 seconds to ensure slow loads are covered
  })();
  true;
`;

export default function NoteViewerScreen() {
  const { noteTitle, googleDriveViewLink } = useLocalSearchParams();
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Standardize Google Drive link to use preview/embed mode to hide additional Drive options
  const getEmbeddableLink = (url) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      return url.replace('/view', '/preview').replace('/edit', '/preview');
    }
    return url;
  };

  const finalUrl = getEmbeddableLink(googleDriveViewLink);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft color={colors.textLight} size={20} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle}>Document Viewer</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{noteTitle}</Text>
        </View>
        <View style={styles.secureBadge}>
          <Shield color={colors.textLight} size={13} />
          <Text style={styles.secureBadgeText}>SECURE</Text>
        </View>
      </View>

      {/* Document Web-Viewer */}
      <View style={styles.webviewContainer}>
        {finalUrl ? (
          <WebView
            source={{ uri: finalUrl }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsFullscreenVideo={true}
            originWhitelist={['*']}
            textInteractionEnabled={false}
            allowsLinkPreview={false}
            injectedJavaScript={DOCUMENT_PROTECTION_JS}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              setLoading(false);
            }}
            renderError={(errorName) => (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load document: {errorName}</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.noDocumentContainer}>
            <Text style={styles.noDocumentText}>No document URL provided</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.navyPrimary} />
            <Text style={styles.loadingText}>Loading secure viewer...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
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
    marginRight: Spacing.two,
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
    fontSize: 16,
  },
  secureBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: colors.active,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  secureBadgeText: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  noDocumentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDocumentText: {
    color: colors.textSecondary,
  },
  loadingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.navyPrimary,
    marginTop: Spacing.three,
    fontWeight: '600',
  },
  errorContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  errorText: {
    color: colors.blocked,
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});
