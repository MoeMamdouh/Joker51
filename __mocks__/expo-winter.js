// Mock for expo/src/winter to prevent Jest 30 isInsideTestCode error
// with Expo SDK 54's lazy __ExpoImportMetaRegistry getter.
// The winter runtime polyfills are not needed in the test environment.
