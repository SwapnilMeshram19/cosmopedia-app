import { registerWebModule, NativeModule } from 'expo';

// CosmoGalleryModule is not available on the web platform.
class CosmoGalleryModule extends NativeModule<{}> {}

export default registerWebModule(CosmoGalleryModule, 'CosmoGalleryModule');
