# Where's Everyone - Real-Time Location Sharing App

A full-stack real-time location-sharing application built with React Native (Expo) and WebSocket technology. The app allows users to share their live location with others and see other users' locations in real-time on a map.

## ⚠️ Important Setup Requirements

Before running the application, you need to set up two critical environment variables:

1. **Google Maps API Key**: Required for map functionality
   - Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Maps SDK for Android and iOS
   - Create an API key with appropriate restrictions
   - Add the API key to your environment variables

2. **WebSocket Server URL**: Required for real-time communication
   - Set up your WebSocket server
   - Note the server URL (e.g., `ws://your-server:8084`)

Create a `.env` file in the root directory with these variables:
```bash
# .env
REACT_APP_WS_URL=ws://your-websocket-server-url:8084
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

⚠️ **Note**: The application will not work without these environment variables properly configured.

## Features

- 🔐 User Authentication
  - Enter display name
  - Select custom emoji avatar
  - Real-time connection status

- 📍 Location Sharing
  - Real-time location updates
  - Custom emoji markers
  - Last updated timestamps
  - Offline status detection

- 🗺️ Interactive Map
  - Google Maps integration
  - Marker clustering for better readability
  - Smooth animations and transitions
  - Custom map styling
  - Haptic feedback on interactions

- 👥 User Management
  - Real-time user list
  - User status indicators
  - Emoji customization
  - User presence tracking

- 🔄 Real-time Updates
  - WebSocket connection
  - Automatic reconnection
  - Heartbeat mechanism
  - Background state handling

## Tech Stack

### Frontend
- React Native (Expo)
- TypeScript
- Redux Toolkit for state management
- React Native Maps
- Expo Location
- WebSocket for real-time communication
- React Native Gesture Handler
- React Native Reanimated

### Backend
- Node.js WebSocket server
- In-memory data store (for MVP)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)
- Google Maps API key (see setup instructions below)

## Detailed Setup Instructions

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/wheres-everyone.git
cd wheres-everyone

# Install dependencies
npm install
# or
yarn install
```

### 2. Google Maps API Key Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
4. Create credentials (API key)
5. Set up API key restrictions:
   - Application restrictions: Android apps and iOS apps
   - API restrictions: Restrict to Maps SDK for Android and iOS

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
# .env
REACT_APP_WS_URL=ws://your-websocket-server-url:8084
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 4. Platform-Specific Setup

#### iOS Setup
1. Open `ios/Podfile` and ensure the Google Maps API key is properly configured
2. Run `cd ios && pod install`

#### Android Setup
1. Open `android/app/src/main/AndroidManifest.xml`
2. Add your Google Maps API key in the manifest:
```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="your-google-maps-api-key"/>
```

### 5. Start the Development Server

```bash
# Start the Expo development server
npm start
# or
yarn start
```

### 6. Running on Devices/Simulators

- Press `i` to open in iOS simulator
- Press `a` to open in Android emulator
- Scan the QR code with Expo Go app on your physical device

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── Map/           # Map-related components
│   ├── UI/            # General UI components
│   └── Modals/        # Modal components
├── context/           # React Context providers
├── store/             # Redux store and slices
├── screens/           # Screen components
├── types/             # TypeScript type definitions
├── constants/         # App constants
└── utils/             # Utility functions
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

## Known Limitations

- In-memory data store (users will be lost on server restart)
- No persistent user sessions
- Limited offline support
- No user authentication system
- No data persistence

## Future Improvements

- [ ] Add user authentication
- [ ] Implement data persistence
- [ ] Add offline support
- [ ] Improve error handling
- [ ] Add unit and E2E tests
- [ ] Implement user blocking
- [ ] Add location history
- [ ] Implement private rooms

## Troubleshooting

### Common Issues

1. **Map not showing up**
   - Verify Google Maps API key is correctly set in environment variables
   - Check API key restrictions in Google Cloud Console
   - Ensure proper platform-specific setup

2. **Location not working**
   - Check location permissions in device settings
   - Verify Expo Location package is properly installed
   - Ensure proper permissions are requested in the app

3. **WebSocket connection issues**
   - Verify WebSocket server URL in environment variables
   - Check network connectivity
   - Ensure WebSocket server is running

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Google Maps Platform](https://developers.google.com/maps)
- [Supercluster](https://github.com/mapbox/supercluster) 