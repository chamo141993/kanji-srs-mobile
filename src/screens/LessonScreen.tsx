import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  completeLesson,
  getPendingLessons,
  initializeDatabase,
  type LessonQueueItem,
  type SubjectType,
} from "../lib/db";

const SUBJECT_BG: Record<SubjectType, string> = {
  RADICAL: "bg-blue-500",
  KANJI: "bg-pink-500",
  VOCABULARY: "bg-purple-500",
};

export default function LessonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [queue, setQueue] = useState<LessonQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentLesson = queue[0] ?? null;
  const currentSubject = currentLesson?.subject ?? null;

  const loadLessons = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await initializeDatabase();
      const lessons = await getPendingLessons();
      setQueue(lessons);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lessons.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLessons();
  }, [loadLessons]);

  useEffect(() => {
    if (!isLoading && !error && queue.length === 0) {
      router.replace("/");
    }
  }, [error, isLoading, queue.length, router]);

  const subjectBgClass = useMemo(() => {
    if (!currentSubject) return "bg-slate-700";
    return SUBJECT_BG[currentSubject.type];
  }, [currentSubject]);

  const handleMarkLearned = useCallback(async () => {
    if (!currentLesson || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await completeLesson(currentLesson.subjectId);

      if (queue.length === 1) {
        router.replace("/");
        return;
      }

      setQueue((prev) => prev.slice(1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete lesson.");
    } finally {
      setIsSubmitting(false);
    }
  }, [currentLesson, isSubmitting, queue.length, router]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="mt-4 text-sm font-semibold uppercase tracking-[3px] text-slate-300">
            Loading lessons...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentLesson || !currentSubject) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={["top", "left", "right"]}>
      <View className="flex-1 px-4 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="mx-auto flex-1 w-full max-w-2xl">
          <View className="rounded-2xl bg-slate-800 px-5 py-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-semibold uppercase tracking-[3px] text-slate-400">
                  Lesson Queue
                </Text>
                <Text className="mt-1 text-lg font-bold text-white">
                  {queue.length} lesson{queue.length === 1 ? "" : "s"} remaining
                </Text>
              </View>

              <View className="rounded-full bg-slate-700 px-4 py-2">
                <Text className="text-xs font-bold uppercase tracking-[2px] text-slate-200">
                  {currentSubject.type.toLowerCase()}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView
            className="mt-5 flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="overflow-hidden rounded-3xl bg-slate-800">
              <View className={`${subjectBgClass} items-center px-6 py-10`}>
                <Text className="text-center text-7xl font-bold text-white">
                  {currentSubject.characters ?? currentSubject.slug}
                </Text>

                <Text className="mt-4 text-sm font-semibold uppercase tracking-[3px] text-white/80">
                  Level {currentSubject.level}
                </Text>
              </View>

              <View className="bg-white p-6">
                <View className="rounded-2xl bg-slate-50 p-4">
                  <Text className="text-xs font-semibold uppercase tracking-[3px] text-slate-400">
                    Meanings
                  </Text>
                  <Text className="mt-2 text-lg font-semibold text-slate-900">
                    {currentSubject.meanings.join(", ")}
                  </Text>
                </View>

                <View className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <Text className="text-xs font-semibold uppercase tracking-[3px] text-slate-400">
                    Readings
                  </Text>
                  <Text className="mt-2 text-lg font-semibold text-slate-900">
                    {currentSubject.readings.length > 0
                      ? currentSubject.readings.join(", ")
                      : "No reading for this subject."}
                  </Text>
                </View>

                {currentSubject.meaningMnemonic ? (
                  <View className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <Text className="text-xs font-semibold uppercase tracking-[3px] text-slate-400">
                      Meaning Mnemonic
                    </Text>
                    <Text className="mt-2 text-base leading-6 text-slate-700">
                      {currentSubject.meaningMnemonic}
                    </Text>
                  </View>
                ) : null}

                {currentSubject.readingMnemonic ? (
                  <View className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <Text className="text-xs font-semibold uppercase tracking-[3px] text-slate-400">
                      Reading Mnemonic
                    </Text>
                    <Text className="mt-2 text-base leading-6 text-slate-700">
                      {currentSubject.readingMnemonic}
                    </Text>
                  </View>
                ) : null}

                {error ? (
                  <View className="mt-4 rounded-2xl bg-red-50 px-4 py-3">
                    <Text className="text-sm text-red-700">{error}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={() => void handleMarkLearned()}
            disabled={isSubmitting}
            activeOpacity={0.85}
            className={`mt-4 rounded-3xl px-5 py-5 ${
              isSubmitting ? "bg-emerald-300" : "bg-emerald-500"
            }`}
          >
            <Text className="text-center text-lg font-bold uppercase tracking-[2px] text-white">
              {isSubmitting ? "Saving..." : "Mark as Learned"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
