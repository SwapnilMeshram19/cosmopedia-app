import { NativeModule, requireNativeModule } from 'expo';

declare class CosmoGalleryModule extends NativeModule<{}> {
  setValueAsync(value: string): Promise<void>;
}

export default requireNativeModule<CosmoGalleryModule>('CosmoGallery');
