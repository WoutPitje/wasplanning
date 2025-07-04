# Mobile App Technical Specification

## Expo/React Native Application

### Structure
```
mobile/
├── app/                    # Expo Router
│   ├── (auth)/
│   ├── (tabs)/
│   ├── locations/
│   └── _layout.tsx
├── components/
│   ├── wash/
│   ├── common/
│   ├── camera/
│   └── location/
├── hooks/
│   ├── useAuth.ts
│   ├── useWashTasks.ts
│   ├── useLocations.ts
│   └── useCamera.ts
├── services/
│   ├── api.ts
│   └── websocket.ts
├── stores/
│   ├── auth.ts
│   ├── locations.ts
│   └── tasks.ts
└── utils/
    ├── licenseplate.ts
    └── location.ts
```

### Tech Stack
- **Framework**: Expo SDK 50+
- **Navigation**: Expo Router (file-based)
- **UI Components**: 
  - NativeWind (TailwindCSS for RN)
  - React Native Elements
  - Expo Vector Icons
- **State**: Zustand + MMKV persistence (confirmed choice)
- **API Client**: Axios with interceptors
- **WebSockets**: Socket.io-client
- **Camera**: Expo Camera
- **Notifications**: Expo Notifications
- **License Plate Recognition**: 
  - expo-camera + ML Kit (Android)
  - Vision framework (iOS)
- **Barcode**: Expo Barcode Scanner

### Key Features
```typescript
// License plate recognition
const recognizePlate = async (imageUri: string) => {
  // ML Kit OCR for plate detection
  const result = await TextRecognition.recognize(imageUri)
  return extractDutchPlate(result.text)
}

// Location-aware push notifications
await Notifications.scheduleNotificationAsync({
  content: {
    title: "Nieuwe wasopdracht",
    body: `${vehicle.licensePlate} toegewezen op ${location.name}`,
    data: {
      taskId: task.id,
      locationId: location.id,
      tenantId: task.tenantId
    }
  },
  trigger: null,
})

// Location filtering for tasks
const filterTasksByUserLocations = (tasks: WashTask[], userLocations: Location[]) => {
  const locationIds = userLocations.map(loc => loc.id)
  return tasks.filter(task => 
    !task.locationId || locationIds.includes(task.locationId)
  )
}
```

### Mobile App Specificaties

- **Platforms**: Android & iOS tegelijk (Expo)
- **Offline**: Geen offline functionaliteit vereist
- **Authenticatie**: Standaard login (geen biometrie)
- **Features**: 
  - Push notificaties voor nieuwe opdrachten (location-aware)
  - Kenteken herkenning via camera
  - Foto's maken voor/na wasbeurt
  - Real-time status updates
  - Barcode scanner voor werkorders
  - Multi-location task filtering
  - Location selector voor cross-location toegang
  - Location-specific dashboards
- **Toekomstig**: RDW API integratie voor auto details

### Mobile Testing
- **Unit Tests**: Jest + React Native Testing Library
- **Component Tests**: @testing-library/react-native
- **E2E Tests**: Detox for device testing
- **Platform Testing**: Expo Go + EAS Build

### Scripts
```json
"start": "expo start",
"android": "expo start --android",
"ios": "expo start --ios",
"test": "jest",
"build:android": "eas build --platform android",
"build:ios": "eas build --platform ios",
"build": "eas build --platform all"
```

### Development
```bash
# Start development server
npm run dev:mobile

# Test on device
# Install Expo Go app and scan QR code

# Build for app stores
npm run build:mobile
```