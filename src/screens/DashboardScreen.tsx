import React, { useCallback, useEffect, useState } from "react";
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
  getDashboardStats,
  importSubjectsFromJson,
  initializeDatabase,
  resetSampleProgress,
  type DashboardStats,
} from "../lib/db";

const BUNDLED_WANIKANI_SUBJECTS = require("../../assets/data/wanikani-subjects-levels-1-5.json");

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await initializeDatabase();
      const nextStats = await getDashboardStats();
      setStats(nextStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const handleReset = useCallback(async () => {
    setIsResetting(true);
    setError(null);

    try {
      await resetSampleProgress();
      const nextStats = await getDashboardStats();
      setStats(nextStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset data.");
    } finally {
      setIsResetting(false);
    }
  }, []);

  const handleImport = useCallback(async () => {
    setIsImporting(true);
    setError(null);
    setImportMessage(null);

    try {
      const result = await importSubjectsFromJson(BUNDLED_WANIKANI_SUBJECTS);
      const nextStats = await getDashboardStats();
      setStats(nextStats);

      if (result.insertedSubjects === 0) {
        setImportMessage("Bundled WaniKani level 1-5 data is already imported.");
      } else {
        setImportMessage(
          `Imported ${result.insertedSubjects} subjects and added ${result.seededReviews} new lessons.`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import data.");
    } finally {
      setIsImporting(false);
    }
  }, []);

  const pendingLessons = stats?.pendingLessons ?? 0;
  const pendingReviews = stats?.pendingReviews ?? 0;
  const lessonDisabled = pendingLessons === 0 || isLoading;
  const reviewDisabled = pendingReviews === 0 || isLoading;

  if (isLoading && !stats) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#ffffff" />
          <Text className="mt-4 text-sm font-semibold uppercase tracking-[3px] text-slate-300">
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 24,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-between">
          <View>
            <Text className="text-sm font-semibold uppercase tracking-[3px] text-slate-400">
              Kanji SRS
            </Text>

            <Text className="mt-3 text-4xl font-bold text-white">Welcome back</Text>

            <Text className="mt-2 text-base text-slate-300">
              Ready for a quick study session?
            </Text>

            <View className="mt-8 rounded-3xl bg-slate-800 p-6">
              <Text className="text-xs font-semibold uppercase tracking-[3px] text-slate-400">
                Current Level
              </Text>
              <Text className="mt-2 text-5xl font-bold text-white">
                {stats?.currentLevel ?? 1}
              </Text>
            </View>

            <View className="mt-5 rounded-3xl bg-slate-800 p-6">
              <Text className="text-xs font-semibold uppercase tracking-[3px] text-slate-400">
                Available Lessons
              </Text>
              <Text className="mt-2 text-5xl font-bold text-white">{pendingLessons}</Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/lesson")}
              disabled={lessonDisabled}
              activeOpacity={0.85}
              className={`mt-5 rounded-3xl px-5 py-5 ${
                lessonDisabled ? "bg-slate-600" : "bg-indigo-500"
              }`}
            >
              <Text className="text-center text-lg font-bold uppercase tracking-[2px] text-white">
                {pendingLessons > 0
                  ? `Start Lessons (${pendingLessons})`
                  : "No Lessons Available"}
              </Text>
            </TouchableOpacity>

            <View className="mt-5 rounded-3xl bg-slate-800 p-6">
              <Text className="text-xs font-semibold uppercase tracking-[3px] text-slate-400">
                Pending Reviews
              </Text>
              <Text className="mt-2 text-5xl font-bold text-white">{pendingReviews}</Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/review")}
              disabled={reviewDisabled}
              activeOpacity={0.85}
              className={`mt-5 rounded-3xl px-5 py-5 ${
                reviewDisabled ? "bg-slate-600" : "bg-pink-500"
              }`}
            >
              <Text className="text-center text-lg font-bold uppercase tracking-[2px] text-white">
                {pendingReviews > 0
                  ? `Start Reviews (${pendingReviews})`
                  : "No Reviews Available"}
              </Text>
            </TouchableOpacity>

            <View className="mt-5 rounded-3xl bg-slate-800 p-6">
              <Text className="text-xs font-semibold uppercase tracking-[3px] text-slate-400">
                SRS Breakdown
              </Text>

              <View className="mt-4 gap-3">
                <View className="flex-row items-center justify-between rounded-2xl bg-slate-700/50 px-4 py-3">
                  <Text className="text-base font-semibold text-white">Apprentice</Text>
                  <Text className="text-base font-bold text-sky-300">
                    {stats?.stageBreakdown.apprentice ?? 0}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between rounded-2xl bg-slate-700/50 px-4 py-3">
                  <Text className="text-base font-semibold text-white">Guru</Text>
                  <Text className="text-base font-bold text-violet-300">
                    {stats?.stageBreakdown.guru ?? 0}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between rounded-2xl bg-slate-700/50 px-4 py-3">
                  <Text className="text-base font-semibold text-white">Master</Text>
                  <Text className="text-base font-bold text-amber-300">
                    {stats?.stageBreakdown.master ?? 0}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between rounded-2xl bg-slate-700/50 px-4 py-3">
                  <Text className="text-base font-semibold text-white">Enlightened</Text>
                  <Text className="text-base font-bold text-emerald-300">
                    {stats?.stageBreakdown.enlightened ?? 0}
                  </Text>
                </View>
              </View>
            </View>

            {error ? (
              <View className="mt-4 rounded-2xl bg-red-50 px-4 py-3">
                <Text className="text-sm text-red-700">{error}</Text>
              </View>
            ) : null}

            {importMessage ? (
              <View className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3">
                <Text className="text-sm text-emerald-700">{importMessage}</Text>
              </View>
            ) : null}
          </View>

          <View className="mt-6 gap-3">
            <TouchableOpacity
              onPress={() => void handleImport()}
              disabled={isImporting}
              activeOpacity={0.85}
              className={`rounded-2xl px-5 py-4 ${
                isImporting ? "bg-indigo-400" : "bg-indigo-600"
              }`}
            >
              <Text className="text-center text-sm font-bold uppercase tracking-[2px] text-white">
                {isImporting ? "Importing..." : "Import Level 1-5 JSON"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => void handleReset()}
              disabled={isResetting}
              activeOpacity={0.85}
              className={`rounded-2xl px-5 py-4 ${
                isResetting ? "bg-slate-500" : "bg-slate-700"
              }`}
            >
              <Text className="text-center text-sm font-bold uppercase tracking-[2px] text-white">
                {isResetting ? "Resetting..." : "Reset Test Data"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
