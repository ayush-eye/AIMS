import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  FlatList,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import api from "../../../services/api";
import { Spacing } from "../../../constants/theme";
import { useAppTheme } from "../../../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EmptyState from "../../../components/EmptyState";
import ErrorState from "../../../components/ErrorState";
import { CourseCardSkeleton } from "../../../components/SkeletonLoader";

export default function CoursesList() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [grade, setGrade] = useState("all");
  const [createLoading, setCreateLoading] = useState(false);
  const router = useRouter();

  const fetchCourses = async () => {
    setError(null);
    try {
      const response = await api.get("/courses");
      setCourses(response.data || []);
    } catch (e) {
      console.error("Error fetching courses:", e);
      setError("Failed to load curriculum workspace. Please check your network connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async () => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Course title is required");
      return;
    }

    setCreateLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        grade: grade,
      };
      if (code.trim()) {
        payload.code = code.trim().toUpperCase();
      }

      const response = await api.post("/courses", payload);
      setCourses((prev) => [response.data, ...prev]);
      // Reset form
      setTitle("");
      setDescription("");
      setCode("");
      setGrade("all");
      setModalVisible(false);
      Alert.alert("Success", "Course created successfully");
    } catch (e) {
      Alert.alert(
        "Error",
        e.response?.data?.message || "Failed to create course",
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteCourse = (courseId, courseTitle) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete this course: "${courseTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/courses/${courseId}`);
              setCourses((prev) => prev.filter((c) => c._id !== courseId));
              Alert.alert("Success", "Course deleted successfully");
            } catch (e) {
              console.error("Error deleting course:", e);
              Alert.alert(
                "Error",
                e.response?.data?.message || "Failed to delete course"
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: Spacing.two }}>
            <Text style={styles.headerTitle}>Course Workspace</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Select a course to build chapters and materials.
            </Text>
          </View>
        </View>
        <View style={{ paddingTop: Spacing.four }}>
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: Spacing.two }}>
            <Text style={styles.headerTitle}>Course Workspace</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Select a course to build chapters and materials.
            </Text>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ErrorState
            title="Workspace Unavailable"
            message={error}
            onRetry={() => {
              setLoading(true);
              fetchCourses();
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navyPrimary} />
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: Spacing.two }}>
          <Text style={styles.headerTitle}>Course Workspace</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Select a course to build chapters and materials.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.createBtnText}>+ New Course</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={courses}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchCourses();
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.courseCard}
            onPress={() =>
              router.push({
                pathname: "/(admin)/curriculum/course",
                params: { courseId: item._id, courseTitle: item.title },
              })
            }
            activeOpacity={0.8}
          >
            <View style={styles.courseHeader}>
              <Text style={styles.courseTitle} numberOfLines={1}>{item.title}</Text>
              <View style={{ flexDirection: "row", gap: Spacing.one }}>
                {item.grade ? (
                  <View style={[styles.codeBadge, { backgroundColor: colors.navyPrimary }]}>
                    <Text style={[styles.codeText, { color: colors.textLight }]}>{item.grade.toUpperCase()}</Text>
                  </View>
                ) : null}
                {item.code ? (
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeText}>{item.code}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Text style={styles.courseDesc} numberOfLines={2}>
              {item.description || "No description provided."}
            </Text>
            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteCourse(item._id, item.title)}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
              </TouchableOpacity>
              <Text style={styles.viewCourseText}>Manage Curriculum ➡️</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="course"
            title="No courses created yet"
            description="Create your first course to start adding chapters, video lectures, and notes."
            actionLabel="+ Create First Course"
            onAction={() => setModalVisible(true)}
          />
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Course</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Course Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Grade 10 Mathematics"
                  placeholderTextColor={colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Course Code (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. MATH10"
                  placeholderTextColor={colors.textSecondary}
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Target Class / Category *</Text>
                <View style={styles.gradeSelector}>
                  {["5th", "6th", "7th", "8th", "9th", "10th", "free", "all"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.gradeChip,
                        grade === g ? styles.gradeChipActive : null,
                      ]}
                      onPress={() => setGrade(g)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.gradeChipText,
                          grade === g ? styles.gradeChipTextActive : null,
                        ]}
                      >
                        {g.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter details about this course..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateCourse}
                disabled={createLoading}
                activeOpacity={0.8}
              >
                {createLoading ? (
                  <ActivityIndicator color={colors.textLight} />
                ) : (
                  <Text style={styles.submitBtnText}>Create Course</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors, insets) => StyleSheet.create({
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.navyPrimary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: insets.top + Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    ...colors.cardShadow,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textLight,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: Spacing.half,
  },
  createBtn: {
    backgroundColor: colors.accentBlue,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.one,
  },
  createBtnText: {
    color: colors.textLight,
    fontWeight: "bold",
    fontSize: 13,
  },
  listContainer: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  courseCard: {
    backgroundColor: colors.background,
    borderRadius: Spacing.two,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: colors.border,
    ...colors.cardShadow,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.two,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
  },
  codeBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
  },
  codeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.accentBlue,
  },
  courseDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: Spacing.two,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deleteBtn: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.half,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  deleteBtnText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "bold",
  },
  viewCourseText: {
    fontSize: 12,
    color: colors.accentBlue,
    fontWeight: "700",
  },
  emptyContainer: {
    padding: Spacing.six,
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    marginBottom: Spacing.four,
  },
  emptyBtn: {
    borderWidth: 1,
    borderColor: colors.navyPrimary,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    backgroundColor: colors.background,
  },
  emptyBtnText: {
    color: colors.navyPrimary,
    fontWeight: "bold",
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
    paddingVertical: Spacing.three,
  },
  inputContainer: {
    marginBottom: Spacing.three,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginBottom: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Spacing.one,
    padding: Spacing.two,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.offWhite,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: colors.navyPrimary,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    alignItems: "center",
    marginTop: Spacing.two,
  },
  submitBtnText: {
    color: colors.textLight,
    fontWeight: "bold",
    fontSize: 16,
  },
  gradeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  gradeChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 20,
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gradeChipActive: {
    backgroundColor: colors.navyPrimary,
    borderColor: colors.navyPrimary,
  },
  gradeChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  gradeChipTextActive: {
    color: colors.textLight,
  },
});
