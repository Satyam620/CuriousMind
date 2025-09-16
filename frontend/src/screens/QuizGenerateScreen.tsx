import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Keyboard,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList, TabParamList } from "../../App";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useFont } from "../contexts/FontContext";
import { geminiService } from "../services/geminiService";
import {
  QuizOption,
  difficulties,
  generateQuestionCounts,
} from "../types/quiz";
import { useScreenAnimation } from "../hooks/useScreenAnimation";
import CustomAlert from "../components/CustomAlert";
import { showAlert, setWebAlertHandler } from "../utils/alertUtils";

type QuizGenerateScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "QuizGenerate">,
  StackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: QuizGenerateScreenNavigationProp;
}

const { width: screenWidth } = Dimensions.get("window");

const QuizGenerateScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { getFontStyle } = useFont();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("any");
  const [selectedQuestionCount, setSelectedQuestionCount] =
    useState<string>("10");
  const [quizTopic, setQuizTopic] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Alert state for web
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  // Set up web alert handler
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      setWebAlertHandler((alert) => {
        setAlertState(alert);
      });
    }
  }, []);

  // Use refactored animation hook
  const { fadeAnim, slideAnim, buttonScale, animateButtonPress } =
    useScreenAnimation();

  const handleGenerateQuiz = async () => {
    // Button press animation using hook
    animateButtonPress();

    try {
      setIsGenerating(true);

      // Generate quiz using Gemini AI
      const generatedQuiz = await geminiService.generateQuiz(
        selectedDifficulty as "easy" | "medium" | "hard" | "any",
        parseInt(selectedQuestionCount),
        quizTopic.trim() || undefined
      );

      // Navigate directly to quiz screen with generated quiz
      navigation.navigate("Quiz", {
        customQuiz: generatedQuiz,
        category: quizTopic || "AI Generated",
        difficulty: selectedDifficulty,
        questionCount: parseInt(selectedQuestionCount),
      });
    } catch (error: any) {
      console.error("Quiz generation error:", error);

      let errorTitle = "Generation Failed";
      let errorMessage = "Failed to generate quiz. Please try again.";

      if (error instanceof Error) {
        if (
          error.message.includes("API key") ||
          error.message.includes("not configured")
        ) {
          errorTitle = "Configuration Error";
          errorMessage =
            "AI service is not properly configured. Please try again later.";
        } else if (error.message.includes("overloaded")) {
          errorTitle = "Service Busy";
          errorMessage =
            "AI service is currently overloaded. Please wait a moment and try again.";
        } else if (error.message.includes("quota") || error.message.includes("limit")) {
          errorTitle = "Quota Exceeded";
          errorMessage =
            "API usage limit reached. Please try again later.";
        } else if (error.message.includes("timeout")) {
          errorTitle = "Request Timeout";
          errorMessage =
            "Quiz generation timed out. Please check your connection and try again.";
        } else if (error.message.includes("temporarily unavailable")) {
          errorTitle = "Service Unavailable";
          errorMessage =
            "AI service is temporarily unavailable. Please try again in a few moments.";
        } else {
          errorMessage = error.message;
        }
      } else if (
        error?.code === "ECONNABORTED" ||
        error?.message?.includes("timeout")
      ) {
        errorTitle = "Connection Timeout";
        errorMessage =
          "Request timed out. Please check your internet connection and try again.";
      } else if (error?.code === "NETWORK_ERROR" || !error?.response) {
        errorTitle = "Network Error";
        errorMessage =
          "Unable to connect to AI service. Please check your internet connection and try again.";
      }

      showAlert({
        title: errorTitle,
        message: errorMessage,
        buttons: [
          { text: "OK", style: "default" },
          { text: "Try Again", onPress: handleGenerateQuiz, style: "cancel" }
        ]
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderOptionSection = (
    title: string,
    options: QuizOption[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <Animated.View
      style={[
        styles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text, ...getFontStyle() },
          ]}
        >
          {title}
        </Text>
        <View
          style={[
            styles.sectionIcon,
            {
              backgroundColor: theme.isDark
                ? "rgba(96, 165, 250, 0.1)"
                : "rgba(59, 130, 246, 0.1)",
            },
          ]}
        >
          <Ionicons
            name={
              title === "Difficulty" ? "speedometer-outline" : "list-outline"
            }
            size={16}
            color={theme.isDark ? "#60A5FA" : "#3B82F6"}
          />
        </View>
      </View>
      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = selectedValue === option.value;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
                isSelected && styles.selectedOptionCard,
              ]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.7}
            >
              {isSelected && (
                <LinearGradient
                  colors={
                    theme.isDark
                      ? ["#1E40AF", "#3B82F6"]
                      : ["#EBF4FF", "#DBEAFE"]
                  }
                  style={styles.selectedGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}

              <View
                style={[
                  styles.optionIcon,
                  isSelected && styles.selectedOptionIcon,
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={22}
                  color={
                    isSelected
                      ? "#FFFFFF"
                      : theme.isDark
                      ? "#60A5FA"
                      : "#3B82F6"
                  }
                />
              </View>

              <Text
                style={[
                  styles.optionLabel,
                  { color: theme.colors.text, ...getFontStyle() },
                  isSelected && {
                    color: theme.isDark ? "#FFFFFF" : "#1D4ED8",
                    fontWeight: "600",
                  },
                ]}
              >
                {option.label}
              </Text>

              {isSelected && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={theme.isDark ? "#34D399" : "#059669"}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.simpleHeader}>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.text, ...getFontStyle() },
            ]}
          >
            AI Quiz Generator
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary, ...getFontStyle() },
            ]}
          >
            ✨ Let artificial intelligence create a personalized quiz just for
            you
          </Text>
        </View>

        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text, ...getFontStyle() },
              ]}
            >
              Quiz Topic
            </Text>
            <View
              style={[
                styles.sectionIcon,
                {
                  backgroundColor: theme.isDark
                    ? "rgba(251, 191, 36, 0.1)"
                    : "rgba(245, 158, 11, 0.1)",
                },
              ]}
            >
              <Ionicons
                name="bulb-outline"
                size={16}
                color={theme.isDark ? "#FBBF24" : "#F59E0B"}
              />
            </View>
          </View>
          <View
            style={{
              ...styles.topicInputContainer,
              backgroundColor: theme.colors.surface,
              borderColor: quizTopic.trim() ? "#3B82F6" : theme.colors.border,
            }}
          >
            <View
              style={[
                styles.inputIconContainer,
                {
                  backgroundColor: theme.isDark
                    ? "rgba(251, 191, 36, 0.1)"
                    : "rgba(245, 158, 11, 0.1)",
                },
              ]}
            >
              <Ionicons
                name="bulb"
                size={18}
                color={theme.isDark ? "#FBBF24" : "#F59E0B"}
              />
            </View>
            <TextInput
              style={[
                styles.topicInput,
                { color: theme.colors.text, ...getFontStyle() },
              ]}
              placeholder="Enter any topic"
              placeholderTextColor={theme.colors.textSecondary}
              value={quizTopic}
              onChangeText={(text) => setQuizTopic(text)}
              multiline={false}
              numberOfLines={1}
              maxLength={100}
              onEndEditing={() => Keyboard.dismiss()}
              onSubmitEditing={() => Keyboard.dismiss()}
              returnKeyType="done"
              clearButtonMode="while-editing"
              autoCorrect={false}
              autoCapitalize="sentences"
              textContentType="none"
            />
            {quizTopic.trim() && (
              <TouchableOpacity
                onPress={() => setQuizTopic("")}
                style={styles.clearButton}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          <View
            style={[
              styles.helperContainer,
              {
                backgroundColor: theme.isDark
                  ? "rgba(34, 197, 94, 0.1)"
                  : "rgba(16, 185, 129, 0.1)",
              },
            ]}
          >
            <Ionicons
              name="information-circle"
              size={14}
              color={theme.isDark ? "#22C55E" : "#10B981"}
            />
            <Text
              style={[
                styles.helperText,
                { color: theme.colors.textSecondary, ...getFontStyle() },
              ]}
            >
              Leave blank for general knowledge questions
            </Text>
          </View>
        </Animated.View>

        {renderOptionSection(
          "Difficulty",
          difficulties,
          selectedDifficulty,
          setSelectedDifficulty
        )}

        {renderOptionSection(
          "Number of Questions",
          generateQuestionCounts,
          selectedQuestionCount,
          setSelectedQuestionCount
        )}

        <Animated.View
          style={[
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.previewContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.previewHeader}>
              <View style={styles.previewTitleContainer}>
                <View
                  style={[
                    styles.previewIconContainer,
                    { backgroundColor: theme.isDark ? "#3B82F6" : "#60A5FA" },
                  ]}
                >
                  <Ionicons name="clipboard" size={20} color="#FFFFFF" />
                </View>
                <Text
                  style={[
                    styles.previewTitle,
                    { color: theme.colors.text, ...getFontStyle() },
                  ]}
                >
                  Quiz Preview
                </Text>
              </View>
              <View
                style={[
                  styles.previewBadge,
                  {
                    backgroundColor: theme.isDark
                      ? "rgba(34, 197, 94, 0.2)"
                      : "rgba(16, 185, 129, 0.2)",
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={theme.isDark ? "#22C55E" : "#10B981"}
                />
                <Text
                  style={[
                    styles.previewText,
                    {
                      color: theme.isDark ? "#22C55E" : "#10B981",
                      ...getFontStyle(),
                    },
                  ]}
                >
                  Ready
                </Text>
              </View>
            </View>

            <View style={styles.previewGrid}>
              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: theme.isDark
                      ? "rgba(251, 191, 36, 0.15)"
                      : "rgba(245, 158, 11, 0.1)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.previewCardIcon,
                    { backgroundColor: "#F59E0B" },
                  ]}
                >
                  <Ionicons name="bulb" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.previewCardContent}>
                  <Text
                    style={[
                      styles.previewCardLabel,
                      { color: theme.colors.textSecondary, ...getFontStyle() },
                    ]}
                  >
                    Topic
                  </Text>
                  <Text
                    style={[
                      styles.previewCardValue,
                      {
                        color: quizTopic.trim()
                          ? theme.colors.text
                          : theme.colors.textSecondary,
                        ...getFontStyle(),
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {quizTopic.trim() || "Any topic"}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: theme.isDark
                      ? "rgba(236, 72, 153, 0.15)"
                      : "rgba(219, 39, 119, 0.1)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.previewCardIcon,
                    {
                      backgroundColor:
                        difficulties.find((d) => d.value === selectedDifficulty)
                          ?.color || "#8B5CF6",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      difficulties.find((d) => d.value === selectedDifficulty)
                        ?.icon || "shuffle"
                    }
                    size={18}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.previewCardContent}>
                  <Text
                    style={[
                      styles.previewCardLabel,
                      { color: theme.colors.textSecondary, ...getFontStyle() },
                    ]}
                  >
                    Difficulty
                  </Text>
                  <Text
                    style={[
                      styles.previewCardValue,
                      { color: theme.colors.text, ...getFontStyle() },
                    ]}
                  >
                    {difficulties.find((d) => d.value === selectedDifficulty)
                      ?.label || "Unknown"}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: theme.isDark
                      ? "rgba(139, 92, 246, 0.15)"
                      : "rgba(124, 58, 237, 0.1)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.previewCardIcon,
                    {
                      backgroundColor:
                        generateQuestionCounts.find(
                          (q) => q.value === selectedQuestionCount
                        )?.color || "#3B82F6",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      generateQuestionCounts.find(
                        (q) => q.value === selectedQuestionCount
                      )?.icon || "flash"
                    }
                    size={18}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.previewCardContent}>
                  <Text
                    style={[
                      styles.previewCardLabel,
                      { color: theme.colors.textSecondary, ...getFontStyle() },
                    ]}
                  >
                    Questions
                  </Text>
                  <Text
                    style={[
                      styles.previewCardValue,
                      { color: theme.colors.text, ...getFontStyle() },
                    ]}
                  >
                    {generateQuestionCounts.find(
                      (q) => q.value === selectedQuestionCount
                    )?.label || selectedQuestionCount}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            {
              opacity: fadeAnim,
              transform: [{ scale: buttonScale }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.generateButton,
              isGenerating && styles.generateButtonDisabled,
            ]}
            onPress={handleGenerateQuiz}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                isGenerating
                  ? ["#9CA3AF", "#6B7280"]
                  : theme.isDark
                  ? ["#3B82F6", "#1D4ED8"]
                  : ["#60A5FA", "#3B82F6"]
              }
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isGenerating ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={[styles.generateButtonText, getFontStyle()]}>
                    AI is crafting your quiz...
                  </Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                  <Text style={[styles.generateButtonText, getFontStyle()]}>
                    Generate AI Quiz
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Custom Alert Modal for Web */}
      {Platform.OS === 'web' && (
        <CustomAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={alertState.buttons}
          onDismiss={() => setAlertState(prev => ({ ...prev, visible: false }))}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
    minHeight: "100%",
  },
  // Header Styles
  header: {
    marginBottom: 20,
  },
  headerGradient: {
    borderRadius: 20,
    margin: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  // Section Styles
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  // Options Styles
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    minWidth: "47%",
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  selectedOptionCard: {
    borderColor: "#3B82F6",
    borderWidth: 2,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  selectedGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    zIndex: 1,
  },
  selectedOptionIcon: {
    backgroundColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    zIndex: 1,
  },
  checkmarkContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
  },
  // Topic Input Styles
  topicInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  topicInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  clearButton: {
    padding: 4,
  },
  helperContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  helperText: {
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  // Preview Styles
  previewContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  previewTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  previewText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  previewGrid: {
    gap: 12,
    marginBottom: 16,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    position: "relative",
    overflow: "hidden",
  },
  previewCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  previewCardContent: {
    flex: 1,
  },
  previewCardLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    opacity: 0.8,
  },
  previewCardValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  previewCardAccent: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 4,
    height: "100%",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  // Generate Button Styles
  generateButton: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  generateButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 3,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sparkleContainer: {
    transform: [{ rotate: "15deg" }],
  },
  // Simple Header Styles (no card container)
  simpleHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
  },
});

export default QuizGenerateScreen;
