module.exports = {
  expo: {
    name: "Nudge",
    slug: "nudge",
    owner: "karan0203",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/app-icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    updates: {
      url: "https://u.expo.dev/b87b8ff5-8ac5-433d-9268-a07ac1da9424",
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
        projectId: "b87b8ff5-8ac5-433d-9268-a07ac1da9424",
      },
    },
  },
};
