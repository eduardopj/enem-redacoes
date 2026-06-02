const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// Workaround for @sentry/react-native v8 bug where uploadSourceMaps: false
// in the Expo plugin config does not prevent the Gradle hook from running.
// This plugin runs after expo prebuild generates android/sentry.properties
// and ensures sentryUploadSourcemaps=false is present.
const withSentryDisableUpload = (config) =>
  withDangerousMod(config, [
    'android',
    (config) => {
      const propsPath = path.join(
        config.modRequest.projectRoot,
        'android',
        'sentry.properties'
      );
      if (fs.existsSync(propsPath)) {
        const content = fs.readFileSync(propsPath, 'utf8');
        if (!content.includes('sentryUploadSourcemaps')) {
          fs.appendFileSync(propsPath, '\nsentryUploadSourcemaps=false\n');
        }
      }
      return config;
    },
  ]);

module.exports = withSentryDisableUpload;
