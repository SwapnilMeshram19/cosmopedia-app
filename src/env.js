import Constants, { ExecutionEnvironment } from 'expo-constants';

// true when running inside the Expo Go app (not a development/production build)
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
