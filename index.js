// Must be first: defines the background news task at module scope (see src/background.js).
import './src/background';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);