import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { DashboardStats } from "../lib/db";
import {
  API_BASE_URL,
  SYNC_BEARER_TOKEN,
  SYNC_URL,
  WEB_DASHBOARD_URL,
} from "../lib/api-config";

const BUNDLED_WANIKANI_SUBJECTS = require("../../assets/data/wanikani-subjects-normalized-levels-1-5.json");
const IS_WEB = Platform.OS === "web";

const WEB_SYNC_PAYLOAD = {
  progress: [
    {
      kanji: "水",
      meaning: "Water",
      status: "memorized",
      source: "expo-web",
    },
    {
      kanji: "火",
      meaning: "Fire",
      status: "learning",
      source: "expo-web",
    },
  ],
};

const DEFAULT_WEB_DASHBOARD_STATS: DashboardStats = {
  currentLevel: 1,
  pendingLessons: 0,
  pendingReviews: 0,
  stageBreakdown: {
    apprentice: 0,
    guru: 0,
    master: 0,
    enlightened: 0,
  },
};

type WebKanjiProgressItem = {
  id: string;
  kanji: string;
  meaning: string;
  status: string;
  level: number;
  nextReviewAt: string | null;
};

type WebDashboardResponse = {
  progress: WebKanjiProgressItem[];
  stats: DashboardStats;
  syncSummary: {
    lastSyncedAt: string | null;
    recordsSynced: number;
    source: string;
  };
  capabilities: {
    webLessons: boolean;
    webReviews: boolean;
    cloudSync: boolean;
  };
  server: {
    status: string;
    service: string;
    timestamp: string;
    uptimeSeconds: number;
  };
};

function formatWebSyncSummary(summary: WebDashboardResponse["syncSummary"]) {
  if (!summary.lastSyncedAt) {
    return "Connected to the Render backend. No cloud syncs have been recorded yet.";
  }

  return `Last cloud sync: ${summary.recordsSynced} record${
    summary.recordsSynced === 1 ? "" : "s"
  } from ${summary.source} at ${new Date(summary.lastSyncedAt).toLocaleString()}.`;
}

function buildFallbackWebStats() {
  const progress = WEB_SYNC_PAYLOAD.progress;
  const learningCount = progress.filter((entry) => entry.status === "learning").length;
  const memorizedCount = progress.filter((entry) => entry.status === "memorized").length;

  return {
    currentLevel: 1,
    pendingLessons: 0,
    pendingReviews: learningCount,
    stageBreakdown: {
      apprentice: learningCount,
      guru: memorizedCount,
      master: 0,
      enlightened: 0,
    },
  };
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [webStatusMessage, setWebStatusMessage] = useState<string | null>(null);
  const [webProgress, setWebProgress] = useState<WebKanjiProgressItem[]>([]);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (IS_WEB) {
        const response = await fetch(WEB_DASHBOARD_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 404) {
          setStats(DEFAULT_WEB_DASHBOARD_STATS);
          setWebStatusMessage(
            "Connected to Render sync. The live /api/web/dashboard route is not deployed yet, so web is using fallback dashboard data."
          );
          return;
        }

        if (!response.ok) {
          throw new Error(`Web dashboard request failed with status ${response.status}.`);
        }

        const payload = (await response.json()) as WebDashboardResponse;
        setWebProgress(payload.progress);
        setStats(payload.stats);
        setWebStatusMessage(formatWebSyncSummary(payload.syncSummary));
        return;
      }

      const { getDashboardStats, initializeDatabase } = await import("../lib/db");
      await initializeDatabase();
      const nextStats = await getDashboardStats();
      setStats(nextStats);
    } catch (err) {
      if (IS_WEB) {
        setWebStatusMessage(null);
        setStats(DEFAULT_WEB_DASHBOARD_STATS);
        setWebProgress([]);
      }
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const handleReset = useCallback(async () => {
    if (IS_WEB) {
      setImportMessage("Reset Test Data is only available on iOS and Android.");
      return;
    }

    setIsResetting(true);
    setError(null);
    setImportMessage(null);

    try {
      const { getDashboardStats, resetSampleProgress } = await import("../lib/db");
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
    if (IS_WEB) {
      setImportMessage("Local SQLite imports are disabled on web. Use Secure Cloud Sync instead.");
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportMessage(null);

    try {
      const { getDashboardStats, importSubjectsFromJson } = await import("../lib/db");
      const result = await importSubjectsFromJson(BUNDLED_WANIKANI_SUBJECTS);
      const nextStats = await getDashboardStats();
      setStats(nextStats);

      if (result.insertedSubjects === 0) {
        setImportMessage("Bundled normalized WaniKani level 1-5 data is already imported.");
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
  const lessonDisabled = IS_WEB || pendingLessons === 0 || isLoading;
  const reviewDisabled = IS_WEB || pendingReviews === 0 || isLoading;
  const importDisabled = IS_WEB || isImporting;
  const resetDisabled = IS_WEB || isResetting;

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
  const handleSync = async () => {
    try {
      setError(null);

      const payload = IS_WEB
        ? WEB_SYNC_PAYLOAD
        : {
            progress: [
              { kanji: "水", meaning: "Water", status: "memorized" },
              { kanji: "火", meaning: "Fire", status: "learning" },
            ],
          };

      const response = await fetch(SYNC_URL, {
        method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SYNC_BEARER_TOKEN}`,
          },
          body: JSON.stringify(payload),
      });

      if (response.ok) {
        if (IS_WEB) {
          const payload = (await response.json()) as
            | {
                progress?: WebKanjiProgressItem[];
                stats?: DashboardStats;
                syncSummary?: WebDashboardResponse["syncSummary"];
                message?: string;
              }
            | undefined;

          if (payload?.progress) {
            setWebProgress(payload.progress);
          }

          if (payload?.stats) {
            setStats(payload.stats);
          } else {
            setStats(buildFallbackWebStats());
          }

          if (payload?.syncSummary) {
            setWebStatusMessage(formatWebSyncSummary(payload.syncSummary));
          } else {
            setWebStatusMessage(
              "Cloud sync succeeded. The live backend has not deployed /api/web/dashboard yet, so this status is using frontend fallback data."
            );
          }
        }

        Alert.alert(
          "Success",
          IS_WEB
            ? "Web sync payload securely sent to the cloud."
            : "Kanji progress securely synced to the cloud!"
        );
      } else {
        Alert.alert("Security Alert", "Sync failed. Unauthorized token.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Could not reach the Node server.");
    }
  };

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
                {IS_WEB
                  ? "Lessons unavailable on web"
                  : pendingLessons > 0
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
                {IS_WEB
                  ? "Reviews unavailable on web"
                  : pendingReviews > 0
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

          <View style={{ marginTop: 20 }}>
            <Button
              title={IS_WEB ? "Secure Cloud Sync (Web)" : "Secure Cloud Sync"}
              color="#841584"
              onPress={handleSync}
            />

            {IS_WEB ? (
              <View className="mt-4 rounded-2xl bg-sky-50 px-4 py-3">
                <Text className="text-sm text-sky-700">
                  Web mode skips local SQLite, loads dashboard status from {API_BASE_URL},
                  and sends a hardcoded sync payload directly to the backend.
                </Text>
              </View>
            ) : null}

            {IS_WEB && webStatusMessage ? (
              <View className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3">
                <Text className="text-sm text-emerald-700">{webStatusMessage}</Text>
              </View>
            ) : null}

            {IS_WEB && webProgress.length > 0 ? (
              <View className="mt-5 rounded-3xl bg-slate-800 p-6">
                <Text className="text-xs font-semibold uppercase tracking-[3px] text-slate-400">
                  Cloud Progress
                </Text>

                <View className="mt-4 gap-3">
                  {webProgress.map((entry) => (
                    <View
                      key={entry.id}
                      className="rounded-2xl bg-slate-700/50 px-4 py-4"
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-2xl font-bold text-white">{entry.kanji}</Text>
                        <Text className="text-xs font-semibold uppercase tracking-[2px] text-slate-300">
                          Level {entry.level}
                        </Text>
                      </View>

                      <Text className="mt-2 text-base font-semibold text-slate-100">
                        {entry.meaning}
                      </Text>

                      <Text className="mt-1 text-sm text-slate-300">
                        Status: {entry.status}
                      </Text>

                      <Text className="mt-1 text-sm text-slate-400">
                        {entry.nextReviewAt
                          ? `Next review: ${new Date(entry.nextReviewAt).toLocaleString()}`
                          : "Next review: not scheduled"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View className="mt-6 gap-3">
              <TouchableOpacity
                onPress={() => void handleImport()}
                disabled={importDisabled}
                activeOpacity={0.85}
                className={`rounded-2xl px-5 py-4 ${
                  importDisabled ? "bg-indigo-400" : "bg-indigo-600"
                }`}
              >
                <Text className="text-center text-sm font-bold uppercase tracking-[2px] text-white">
                  {IS_WEB
                    ? "Import Disabled on Web"
                    : isImporting
                      ? "Importing..."
                      : "Import WaniKani Levels 1-5"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => void handleReset()}
                disabled={resetDisabled}
                activeOpacity={0.85}
                className={`rounded-2xl px-5 py-4 ${
                  resetDisabled ? "bg-slate-500" : "bg-slate-700"
                }`}
              >
                <Text className="text-center text-sm font-bold uppercase tracking-[2px] text-white">
                  {IS_WEB
                    ? "Reset Disabled on Web"
                    : isResetting
                      ? "Resetting..."
                      : "Reset Test Data"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
