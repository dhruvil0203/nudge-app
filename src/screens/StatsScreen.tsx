import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useLinks } from "../hooks/useLinks";
import { Ionicons } from "@expo/vector-icons";

interface StatsScreenProps {
  navigation?: any;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { pendingLinks, completedLinks } = useLinks();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, []),
  );

  const safePending = Array.isArray(pendingLinks) ? pendingLinks : [];
  const safeCompleted = Array.isArray(completedLinks) ? completedLinks : [];
  const totalLinks = safePending.length + safeCompleted.length;
  const pendingCount = safePending.length;
  const completedCount = safeCompleted.length;

  const getDomainStats = () => {
    const allLinks = [...safePending, ...safeCompleted];
    const domainMap: Record<string, number> = {};

    allLinks.forEach((link) => {
      if (link.domain) {
        domainMap[link.domain] = (domainMap[link.domain] || 0) + 1;
      }
    });

    return Object.entries(domainMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const getWeeklyLinksByDay = (): number[] => {
    const allLinks = [...safePending, ...safeCompleted];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const counts: number[] = new Array(7).fill(0);

    allLinks.forEach((link) => {
      const created = new Date(link.created_at);
      if (created >= startOfWeek) {
        const linkDay = created.getDay();
        counts[linkDay]++;
      }
    });

    return counts;
  };

  const getWeeklyStats = () => {
    const allLinks = [...safePending, ...safeCompleted];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return allLinks.filter((link) => {
      const created = new Date(link.created_at);
      return created >= startOfWeek;
    }).length;
  };

  const domainStats = getDomainStats();
  const weeklyCount = getWeeklyStats();
  const weeklyLinksByDay = getWeeklyLinksByDay();
  const maxDayCount = Math.max(...weeklyLinksByDay, 1);
  const maxDomainCount = Math.max(...domainStats.map(([, count]) => count), 1);

  const getDomainIcon = (domain: string) => {
    if (domain?.includes("youtube")) return "logo-youtube";
    if (domain?.includes("x.com") || domain?.includes("twitter"))
      return "logo-twitter";
    if (domain?.includes("instagram")) return "logo-instagram";
    if (domain?.includes("github")) return "logo-github";
    return "globe-outline";
  };

  const getDomainColor = (domain: string) => {
    if (domain?.includes("youtube")) return "#FF0000";
    if (domain?.includes("x.com") || domain?.includes("twitter"))
      return "#1DA1F2";
    if (domain?.includes("instagram")) return "#E4405F";
    return theme.primary;
  };

  const renderDonutChart = () => {
    const size = 120;
    const strokeWidth = 12;
    const pendingPercent = totalLinks > 0 ? pendingCount / totalLinks : 0;

    return (
      <View style={styles.donutContainer}>
        <View
          style={[
            styles.donutOuter,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: theme.warmPeach,
            },
          ]}
        >
          {totalLinks > 0 && (
            <View
              style={[
                styles.donutPendingArc,
                {
                  position: "absolute",
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: strokeWidth,
                  borderColor: theme.primary,
                  borderRightColor:
                    pendingPercent > 0.5 ? theme.primary : "transparent",
                  borderBottomColor:
                    pendingPercent > 0.25 ? theme.primary : "transparent",
                  borderLeftColor: "transparent",
                  borderTopColor: "transparent",
                  transform: [{ rotate: "-90deg" }],
                },
              ]}
            />
          )}
          <View
            style={[
              styles.donutInner,
              { backgroundColor: theme.surface },
            ]}
          >
            <Text style={[styles.donutValue, { color: theme.text }]}>
              {totalLinks}
            </Text>
            <Text
              style={[styles.donutLabel, { color: theme.textSecondary }]}
            >
              Total Links
            </Text>
          </View>
        </View>
        <View style={styles.donutStats}>
          <View style={styles.statItem}>
            <View
              style={[styles.statDot, { backgroundColor: theme.primary }]}
            />
            <View>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {pendingCount}
              </Text>
              <Text
                style={[styles.statLabel, { color: theme.textSecondary }]}
              >
                Pending
              </Text>
            </View>
          </View>
          <View style={styles.statItem}>
            <View
              style={[styles.statDot, { backgroundColor: theme.success }]}
            />
            <View>
              <Text style={[styles.statValue, { color: theme.success }]}>
                {completedCount}
              </Text>
              <Text
                style={[styles.statLabel, { color: theme.textSecondary }]}
              >
                Completed
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderBarChart = () => {
    const days = ["S", "M", "T", "W", "T", "F", "S"];
    const now = new Date();
    const dayOfWeek = now.getDay();

    return (
      <View style={styles.barChartContainer}>
        <View style={styles.barChartHeader}>
          <View>
            <Text style={[styles.barChartTitle, { color: theme.text }]}>
              This Week
            </Text>
            <Text
              style={[
                styles.barChartSubtitle,
                { color: theme.textSecondary },
              ]}
            >
              You saved {weeklyCount} link{weeklyCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        <View style={styles.barChart}>
          {days.map((day, index) => {
            const isToday = index === dayOfWeek;
            const count = weeklyLinksByDay[index];
            const barHeight =
              totalLinks === 0
                ? 8
                : Math.max(8, (count / maxDayCount) * 70);

            return (
              <View key={index} style={styles.barColumn}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: isToday
                        ? theme.primary
                        : count > 0
                          ? theme.primaryLight
                          : theme.warmPeach,
                      opacity: count > 0 || isToday ? 1 : 0.5,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.barLabel,
                    {
                      color: isToday
                        ? theme.primary
                        : theme.textSecondary,
                      fontWeight: isToday ? "700" : "500",
                    },
                  ]}
                >
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTopDomains = () => {
    return (
      <View style={styles.domainsContainer}>
        <View style={styles.domainsHeader}>
          <Text style={[styles.domainsTitle, { color: theme.text }]}>
            Top Domains
          </Text>
        </View>
        {domainStats.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Ionicons
              name="globe-outline"
              size={28}
              color={theme.tabInactive}
            />
            <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
              No data yet
            </Text>
            <Text
              style={[
                styles.noDataSubtext,
                { color: theme.tabInactive },
              ]}
            >
              Save some links to see your top domains
            </Text>
          </View>
        ) : (
          domainStats.map(([domain, count]) => (
            <View key={domain} style={styles.domainRow}>
              <View style={styles.domainLeft}>
                <View
                  style={[
                    styles.domainIconContainer,
                    { backgroundColor: getDomainColor(domain) + "20" },
                  ]}
                >
                  <Ionicons
                    name={getDomainIcon(domain) as any}
                    size={16}
                    color={getDomainColor(domain)}
                  />
                </View>
                <Text style={[styles.domainName, { color: theme.text }]}>
                  {domain}
                </Text>
              </View>
              <View style={styles.domainRight}>
                <View
                  style={[
                    styles.domainBar,
                    { backgroundColor: theme.surfaceElevated },
                  ]}
                >
                  <View
                    style={[
                      styles.domainBarFill,
                      {
                        backgroundColor: getDomainColor(domain),
                        width: `${(count / maxDomainCount) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.domainCount,
                    { color: theme.textSecondary },
                  ]}
                >
                  {count}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={[styles.backButton, { backgroundColor: theme.surfaceElevated }]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Your Progress
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentInner}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View
            style={[
              styles.progressCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                ...Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.2 : 0.06,
                    shadowRadius: 8,
                  },
                  android: { elevation: isDark ? 4 : 2 },
                }),
              },
            ]}
          >
            {renderDonutChart()}
          </View>

          <View
            style={[
              styles.chartCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                ...Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.2 : 0.06,
                    shadowRadius: 8,
                  },
                  android: { elevation: isDark ? 4 : 2 },
                }),
              },
            ]}
          >
            {renderBarChart()}
          </View>

          <View
            style={[
              styles.domainsCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                ...Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.2 : 0.06,
                    shadowRadius: 8,
                  },
                  android: { elevation: isDark ? 4 : 2 },
                }),
              },
            ]}
          >
            {renderTopDomains()}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 100,
  },
  progressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  domainsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  donutContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
  },
  donutOuter: {
    justifyContent: "center",
    alignItems: "center",
  },
  donutPendingArc: {
    overflow: "hidden",
  },
  donutInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  donutValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  donutLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  donutStats: {
    flex: 1,
    gap: 20,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 1,
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  barChartContainer: {
    gap: 16,
  },
  barChartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  barChartTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  barChartSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  barChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
    paddingTop: 20,
  },
  barColumn: {
    alignItems: "center",
    gap: 8,
  },
  bar: {
    width: 24,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  domainsContainer: {
    gap: 12,
  },
  domainsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  domainsTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  noDataContainer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  noDataText: {
    fontSize: 14,
    fontWeight: "600",
  },
  noDataSubtext: {
    fontSize: 12,
  },
  domainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  domainLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  domainIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  domainName: {
    fontSize: 14,
    fontWeight: "600",
  },
  domainRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  domainBar: {
    width: 80,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  domainBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  domainCount: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 20,
    textAlign: "right",
  },
});

export default StatsScreen;
