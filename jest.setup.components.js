// Force eager resolution of __ExpoImportMetaRegistry before test code runs.
// This prevents the lazy getter from firing when isInsideTestCode === false.
// Required for Expo SDK 54 + Jest 30 compatibility.
try {
  // Access the global to trigger lazy loading while still in setup scope
  const reg = global.__ExpoImportMetaRegistry;
  if (!reg) {
    // eslint-disable-next-line no-global-assign
    global.__ExpoImportMetaRegistry = { url: null };
  }
} catch {
  global.__ExpoImportMetaRegistry = { url: null };
}
