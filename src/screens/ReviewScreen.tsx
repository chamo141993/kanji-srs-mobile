import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReviewQueueItem, SubjectType } from "../lib/db";

type FeedbackTone = "correct" | "incorrect" | null;

const SUBJECT_BG: Record<SubjectType, string> = {
  RADICAL: "bg-blue-500",
  KANJI: "bg-pink-500",
  VOCABULARY: "bg-purple-500",
};

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();

  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submissionLockRef = useRef(false);

  const currentReview = queue[0] ?? null;
  const currentSubject = currentReview?.subject ?? null;

  const clearAdvanceTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const releaseSubmissionLock = () => {
    submissionLockRef.current = false;
    setIsSubmitting(false);
  };

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { getPendingReviews, initializeDatabase } = await import("../lib/db");
      await initializeDatabase();
      const dueReviews = await getPendingReviews();
      setQueue(dueReviews);
      setIsRevealed(false);
      setFeedbackTone(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();

    return () => {
      clearAdvanceTimer();
      submissionLockRef.current = false;
    };
  }, [loadQueue]);

  useEffect(() => {
    setIsRevealed(false);
    setFeedbackTone(null);
    setError(null);
  }, [currentReview?.reviewStatisticId]);

  const subjectBgClass = useMemo(() => {
    if (!currentSubject) return "bg-slate-700";
    return SUBJECT_BG[currentSubject.type];
  }, [currentSubject]);

  const feedbackBgClass = useMemo(() => {
    if (feedbackTone === "correct") return "bg-emerald-500";
    if (feedbackTone === "incorrect") return "bg-red-500";
    return subjectBgClass;
  }, [feedbackTone, subjectBgClass]);

  const advanceToNextReview = useCallback(
    async (shouldReload: boolean) => {
      timeoutRef.current = null;
      setQueue((prev) => prev.slice(1));
      setIsRevealed(false);
      setFeedbackTone(null);

      try {
        if (shouldReload) {
          await loadQueue();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to refresh reviews.");
      } finally {
        releaseSubmissionLock();
      }
    },
    [loadQueue]
  );

  const handleGrade = useCallback(
    async (isCorrect: boolean) => {
      if (!currentReview || submissionLockRef.current || isSubmitting) return;

      submissionLockRef.current = true;
      setIsSubmitting(true);
      clearAdvanceTimer();
      setError(null);

      try {
        const { submitReviewAnswer } = await import("../lib/db");
        await submitReviewAnswer({
          reviewStatisticId: currentReview.reviewStatisticId,
          isCorrect,
        });

        setFeedbackTone(isCorrect ? "correct" : "incorrect");

        const shouldReload = queue.length === 1;

        timeoutRef.current = setTimeout(() => {
          void advanceToNextReview(shouldReload);
        }, 550);
      } catch (err) {
        setFeedbackTone(null);
        setError(err instanceof Error ? err.message : "Failed to submit review.");
        releaseSubmissionLock();
      }
    },
    [advanceToNextReview, currentReview, isSubmitting, queue.length]
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="mt-4 text-sm font-semibold uppercase tracking-[3px] text-slate-300">
            Loading reviews...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentReview || !currentSubject) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full max-w-md rounded-3xl bg-slate-800 p-8">
            <Text className="text-center text-xs font-semibold uppercase tracking-[3px] text-slate-400">
              Review Queue
            </Text>

            <Text className="mt-4 text-center text-3xl font-bold text-white">
              No reviews remaining
            </Text>

            <Text className="mt-3 text-center text-base text-slate-300">
              You&apos;re all caught up for now.
            </Text>

            <TouchableOpacity
              onPress={() => void loadQueue()}
              className="mt-8 rounded-2xl bg-white px-5 py-4"
              activeOpacity={0.85}
            >
              <Text className="text-center text-sm font-bold uppercase tracking-[2px] text-slate-900">
                Refresh
              </Text>
            </TouchableOpacity>

            {error ? (
              <Text className="mt-4 text-center text-sm text-red-300">{error}</Text>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={["top", "left", "right"]}>
      <View
        className="flex-1 px-4 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="mx-auto flex-1 w-full max-w-2xl">
          <View className="rounded-2xl bg-slate-800 px-5 py-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs font-semibold uppercase tracking-[3px] text-slate-400">
                  Review Session
                </Text>
                <Text className="mt-1 text-lg font-bold text-white">
                  {queue.length} review{queue.length === 1 ? "" : "s"} remaining
                </Text>
              </View>

              <View className="rounded-full bg-slate-700 px-4 py-2">
                <Text className="text-xs font-bold uppercase tracking-[2px] text-slate-200">
                  {currentSubject.type.toLowerCase()}
                </Text>
              </View>
            </View>
          </View>

          <View className="relative mt-5 overflow-hidden rounded-3xl bg-slate-800">
            {feedbackTone ? (
              <View
                pointerEvents="none"
                className="absolute inset-x-0 top-4 z-10 items-center"
              >
                <View
                  className={`rounded-full px-4 py-2 ${
                    feedbackTone === "correct" ? "bg-emerald-500/95" : "bg-red-500/95"
                  }`}
                >
                  <Text className="text-sm font-bold uppercase tracking-[2px] text-white">
                    {feedbackTone === "correct" ? "Correct" : "Incorrect"}
                  </Text>
                </View>
              </View>
            ) : null}

            <View
              className={`${feedbackBgClass} min-h-[320px] items-center justify-center px-6 py-10`}
            >
              <Text className="text-center text-7xl font-bold text-white">
                {currentSubject.characters ?? currentSubject.slug}
              </Text>

              <Text className="mt-4 text-sm font-semibold uppercase tracking-[3px] text-white/80">
                Level {currentSubject.level}
              </Text>
            </View>

            <View className="bg-white p-6">
              {!isRevealed ? (
                <View>
                  <Text className="text-center text-base text-slate-500">
                    Try to recall the answer before revealing it.
                  </Text>

                  <TouchableOpacity
                    onPress={() => setIsRevealed(true)}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                    className={`mt-6 rounded-2xl px-5 py-5 ${
                      isSubmitting ? "bg-slate-400" : "bg-slate-900"
                    }`}
                  >
                    <Text className="text-center text-base font-bold uppercase tracking-[2px] text-white">
                      Show Answer
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View className="rounded-2xl bg-slate-50 p-4">
                    <Text className="text-xs font-semibold uppercase tracking-[3px] text-slate-400">
                      Meaning
                    </Text>
                    <Text className="mt-2 text-lg font-semibold text-slate-900">
                      {currentSubject.meanings.join(", ")}
                    </Text>

                    {currentSubject.readings.length > 0 ? (
                      <>
                        <Text className="mt-5 text-xs font-semibold uppercase tracking-[3px] text-slate-400">
                          Reading
                        </Text>
                        <Text className="mt-2 text-lg font-semibold text-slate-900">
                          {currentSubject.readings.join(", ")}
                        </Text>
                      </>
                    ) : null}
                  </View>

                  <View className="mt-6 flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => void handleGrade(false)}
                      disabled={isSubmitting}
                      activeOpacity={0.85}
                      className={`flex-1 rounded-2xl px-4 py-5 ${
                        isSubmitting ? "bg-red-300" : "bg-red-500"
                      }`}
                    >
                      <Text className="text-center text-base font-bold uppercase tracking-[2px] text-white">
                        Incorrect
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => void handleGrade(true)}
                      disabled={isSubmitting}
                      activeOpacity={0.85}
                      className={`flex-1 rounded-2xl px-4 py-5 ${
                        isSubmitting ? "bg-emerald-300" : "bg-emerald-500"
                      }`}
                    >
                      <Text className="text-center text-base font-bold uppercase tracking-[2px] text-white">
                        Correct
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {error ? (
                <View className="mt-4 rounded-2xl bg-red-50 px-4 py-3">
                  <Text className="text-sm text-red-700">{error}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
