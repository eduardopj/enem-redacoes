/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: { '$0': 'jest', config: 'e2e/jest.config.js' },
    jest: { setupTimeout: 120000 },
  },

  apps: {
    'ios.release': {
      type: 'ios.app',
      // Build with: npx expo run:ios --configuration Release
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/EnemIA.app',
      build: 'npx expo run:ios --configuration Release --no-bundler',
    },
    'android.release': {
      type: 'android.apk',
      // Build with: npx expo run:android --variant release
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },

  devices: {
    'ios.simulator': {
      type: 'ios.simulator',
      device: { type: 'iPhone 15' },
    },
    'android.emulator': {
      type: 'android.emulator',
      device: { avdName: 'Pixel_7_API_34' },
    },
  },

  configurations: {
    'ios.sim.release': {
      device: 'ios.simulator',
      app: 'ios.release',
    },
    'android.emu.release': {
      device: 'android.emulator',
      app: 'android.release',
    },
  },
};
