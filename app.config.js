module.exports = {
  expo: {
    name: "Nudge",
    slug: "nudge-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/app-icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0D0D0D",
    },
    updates: {
      enabled: true,
      fallbackToCacheTimeout: 10000,
      url: "https://u.expo.dev/091d3312-7932-4173-9ced-7086e5373f46",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      bundleIdentifier: "com.nudge.app",
      supportsTablet: true,
      buildNumber: "1.0.0",
      runtimeVersion: {
        policy: "appVersion",
      },
      infoPlist: {
        NSPhotoLibraryUsageDescription: "Allow Nudge to access your photos to set a profile picture.",
      },
    },
    android: {
      package: "com.nudge.app",
      versionCode: 1,
      runtimeVersion: "1.0.0",
      adaptiveIcon: {
        foregroundImage: "./assets/app-icon.png",
        backgroundColor: "#0D0D0D",
      },
      permissions: [
        "android.permission.INTERNET",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.USE_EXACT_ALARM",
        "android.permission.RECEIVE_BOOT_COMPLETED",
      ],
      intentFilters: [
        {
          action: "android.intent.action.SEND",
          category: "android.intent.category.DEFAULT",
          data: {
            mimeType: "text/plain",
          },
        },
        {
          action: "android.intent.action.VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "nudge",
            },
          ],
          category: ["android.intent.category.DEFAULT", "android.intent.category.BROWSABLE"],
        },
      ],
    },
    web: {
      favicon: "./assets/app-icon.png",
    },
    scheme: "nudge",
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#E8A882",
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "091d3312-7932-4173-9ced-7086e5373f46",
      },
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    experiments: {
      tsconfigPaths: true,
    },
  },
};
