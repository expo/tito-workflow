import { ExpoConfig, ConfigContext } from "expo/config";

// Use some env variables to determine if we're in staging or production
const IS_STAGING =
  process.env.EAS_BUILD_PROFILE === "production" ? false : true;

const extraUpdatesConfig: ExpoConfig["updates"] = IS_STAGING
  ? {
      useEmbeddedUpdate: false,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 60_000,
      requestHeaders: {
        // This is useful to configure for when you run your builds locally,
        // rather than on EAS - to ensure that it's configured to have a channel
        "expo-channel-name": "staging",
      },
    }
  : {};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name!,
  slug: config.slug!,
  updates: {
    ...config.updates,
    ...extraUpdatesConfig,
  },
});
