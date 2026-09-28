import { requireOptionalNativeModule } from 'expo';

// Returns null where the native module isn't built in (Expo Go, web, iOS),
// so callers can fail gracefully instead of crashing on import.
export default requireOptionalNativeModule('CosmoGallery');