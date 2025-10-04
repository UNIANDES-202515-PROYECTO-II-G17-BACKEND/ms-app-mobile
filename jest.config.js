// jest.config.js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/tests/**/*.test.[jt]s?(x)'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    // Transpila paquetes RN/Expo dentro de node_modules
    'node_modules/(?!(react-native' +
      '|@react-native' +
      '|react-clone-referenced-element' +
      '|@react-native-community' +
      '|expo(nent)?' +
      '|@expo(nent)?/.*' +
      '|expo-modules-core' +
      '|@unimodules/.*' +
      '|unimodules-.*' +
      '|sentry-expo' +
      '|native-base' +
      '|react-native-svg' +
      ')/)',
  ],
  // Mapea assets si los importas en componentes (png, svg, etc.)
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|webp)$': '<rootDir>/tests/mocks/fileMock.js',
    '\\.(svg)$': '<rootDir>/tests/mocks/svgMock.js',
  },
};
