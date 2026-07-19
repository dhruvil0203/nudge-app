# Nudge - Universal Link Saving and Reminder Tool

A React Native mobile app built with Expo that allows you to save links from any app, set reminders, and stay organized.

## 📸 App Preview

<img src="assets/home-image.jpeg" alt="Nudge App Home Screen" width="300"/>

## Features

✨ **Link Management**

- Save links from any app using the native Share Sheet
- Manually paste URLs or auto-detect from clipboard
- Fetch Open Graph metadata (title, image, description)
- Organize links with priority levels (Important, Normal, Someday)

📱 **Smart Reminders**

- Set reminders: In 1 Hour, Tonight at 8 PM, Tomorrow at 9 AM, or Custom
- Local push notifications integrated with expo-notifications
- Snooze functionality for pending links
- Weekly digest notification every Sunday

🎨 **User Experience**

- Light and Dark theme support
- Two-tab interface (Pending & Completed)
- Beautiful link cards with thumbnails
- Fully offline with no backend required

💾 **Local Storage**

- All data stored locally using @react-native-async-storage/async-storage
- No cloud syncing or external dependencies
- Complete privacy - your links stay on your device

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1. Clone the repository or navigate to the project directory
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npx expo start
```

4. Open the app:
   - iOS: Press `i` to open in iOS Simulator
   - Android: Press `a` to open in Android Emulator
   - Web: Press `w` to open in web browser

## Project Structure

```
Nudge/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Main home screen with tabs
│   │   ├── ProfileScreen.tsx       # User profile with stats
│   │   ├── StatsScreen.tsx         # Link statistics & analytics
│   │   └── SettingsScreen.tsx      # App settings panel
│   ├── components/
│   │   ├── LinkCard.tsx            # Individual link card component
│   │   ├── AddLinkModal.tsx        # Modal for adding new links
│   │   ├── ReminderPicker.tsx      # Reminder selection interface
│   │   ├── LinksList.tsx           # List container for links
│   │   └── UserAvatar.tsx          # Profile avatar component
│   ├── hooks/
│   │   ├── useLinks.ts             # Links state hook
│   │   └── useConnectivity.ts      # Network connectivity detection
│   ├── context/
│   │   ├── ThemeContext.tsx         # Light/dark theme provider
│   │   ├── LinksContext.tsx         # Links CRUD state management
│   │   ├── ProfileContext.tsx       # User profile persistence
│   │   └── ToastContext.tsx         # Toast & confirm dialogs
│   ├── utils/
│   │   ├── database.ts             # AsyncStorage persistence layer
│   │   ├── metadata.ts             # Open Graph metadata fetching
│   │   ├── notifications.ts        # Notification scheduling
│   │   ├── clipboard.ts            # Clipboard utilities
│   │   ├── shareSheet.ts           # Share sheet URL handler
│   │   └── deepLink.ts             # Deep linking handler
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   └── constants/
│       ├── theme.ts                # Light and dark theme definitions
│       └── index.ts                # App constants
├── App.tsx                         # Main app entry point
├── app.config.js                   # Expo configuration
├── package.json                    # Dependencies and scripts
└── tsconfig.json                   # TypeScript configuration
```

## Usage

### Adding a Link

1. Tap the **+** button at the bottom right
2. Paste or type a URL
3. Select priority (Important, Normal, or Someday)
4. The app automatically fetches metadata
5. Tap "Add" to save

### Setting a Reminder

1. After adding a link or tap **Snooze** on existing link
2. Choose: No Reminder, In 1 Hour, Tonight, Tomorrow, or Custom
3. For custom reminders, select date and time
4. Tap **Confirm** to schedule the notification

### Managing Links

- **Pending Tab**: Shows unsaved links with action buttons
  - **Open**: Opens the link in your browser
  - **Done**: Marks as complete and moves to Completed tab
  - **Snooze**: Updates or sets a new reminder
  - **Delete**: Permanently removes the link

- **Completed Tab**: Shows finished links
  - **Open**: Opens the link again
  - **Delete**: Removes from completed list

### Settings

- **Dark Mode**: Toggle between light and dark themes
- **Weekly Digest**: Enable/disable Sunday reminder notifications
- **Clear Completed**: Delete all links from the Completed tab

## Key Technologies

- **React Native**: Cross-platform mobile development
- **Expo**: Simplified React Native development
- **TypeScript**: Type-safe development
- **AsyncStorage**: Local persistent key-value storage
- **React Navigation**: Screen navigation (NativeStack + custom bottom tabs)
- **React Context API**: State management (no Redux)
- **expo-notifications**: Local push notifications
- **expo-clipboard**: Clipboard access
- **expo-linking**: Deep linking & share sheet URL handling
- **expo-image-picker**: Profile picture selection
- **react-native-safe-area-context**: Safe area insets handling
- **react-native-gesture-handler**: Gesture support
- **react-native-reanimated**: Animation engine
- **@expo/vector-icons (Ionicons)**: Icon library
- **axios**: HTTP client for metadata fetching

## Error Handling & Resilience

The app handles runtime scenarios gracefully to ensure a robust user experience:

- **Network Failures**: Offline fallback allows link saving even when metadata fetching fails.
- **Invalid Input**: Built-in URL validation and auto-protocol normalization.
- **System Permissions**: Graceful fallback handles notification and clipboard permission denials.


## ⚙️ Architecture & System Design

### 📶 Offline-First Design
Nudge is built to work completely offline without relying on external cloud servers:
- **Local Storage**: All user data, settings, and links are stored locally on the device using `@react-native-async-storage/async-storage`.
- **Local Notifications**: Reminder scheduling uses `expo-notifications` directly on the operating system level.
- **Native Sharing**: Share sheet integration connects directly with the native iOS/Android sharing mechanics.

### ⚡ Performance & Optimization
- **Optimized Network Fetching**: Open Graph metadata fetching is limited by a 5-second timeout to prevent lag.
- **Cached Asset Fallbacks**: Fast image loading with local placeholder fallbacks for custom/missing OG images.
- **Efficient Storage Operations**: AsyncStorage reads/writes are optimized with a custom `AsyncMutex` to prevent race conditions and ensure data integrity.

## Future Enhancements

Potential features for future versions:

- Export/import links
- Link categories or tags
- Search and filter functionality
- Link statistics and analytics
- iCloud sync (optional)
- Browser extensions
- Web app companion

## Troubleshooting

### Links not appearing

- Check that the database initialized correctly
- Clear app cache and reinstall

### Notifications not working

- Verify notification permissions are granted
- Check that reminders are actually set
- On Android, ensure notifications are not blocked

### Metadata not fetching

- Check internet connection
- Website may not have proper OG tags
- Try adding the link manually

### Dark mode not working

- Ensure ThemeProvider wraps the entire app
- Check that theme context is properly initialized

## Support

For issues or feature requests, please open an issue in the repository.

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using React Native and Expo
