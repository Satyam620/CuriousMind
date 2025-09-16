import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { quizAPI, Quiz } from '../services/api';
import { useFont } from '../contexts/FontContext';

type QuizListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'QuizList'>;

interface Props {
  navigation: QuizListScreenNavigationProp;
}

export default function QuizListScreen({ navigation }: Props) {
  const { getFontStyle } = useFont();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const data = await quizAPI.getAllQuizzes();
      setQuizzes(data);
    } catch (err) {
      setError('Failed to load quizzes');
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderQuizItem = ({ item }: { item: Quiz }) => (
    <TouchableOpacity 
      style={styles.quizItem}
      onPress={() => navigation.navigate('Quiz', { quizId: item.id })}
    >
      <View style={styles.quizContent}>
        <Text style={[styles.quizTitle, getFontStyle()]}>{item.title}</Text>
        <Text style={[styles.quizDescription, getFontStyle()]}>{item.description}</Text>
        <View style={styles.quizInfo}>
          <Text style={[styles.questionCount, getFontStyle()]}>{item.question_count} questions</Text>
          <Text style={[styles.createdDate, getFontStyle()]}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.loadingText, getFontStyle()]}>Loading quizzes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorText, getFontStyle()]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchQuizzes}>
          <Text style={[styles.retryButtonText, getFontStyle()]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={quizzes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderQuizItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 20,
  },
  quizItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  quizContent: {
    padding: 20,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  quizDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    lineHeight: 22,
  },
  quizInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionCount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  createdDate: {
    fontSize: 14,
    color: '#999',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});