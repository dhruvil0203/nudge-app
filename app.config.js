module.exports = {
  expo: {
    name: "Nudge",
    slug: "nudge-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/app-icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    updates: {
      url: "",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      bundleIdentifier: "com.nudge.app",
      runtimeVersion: {
        policy: "appVersion",
      },
    },
    android: {
      package: "com.nudge.app",
      runtimeVersion: "1.0.0",
      adaptiveIcon: {
        foregroundImage: "./assets/app-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: [
        "android.permission.INTERNET",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.USE_EXACT_ALARM",
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
          color: "#ffffff",
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "091d3312-7932-4173-9ced-7086e5373f46",
      },
    },
  },
};
