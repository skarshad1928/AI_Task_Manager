const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function withUsageAccess(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    const permissions = manifest["uses-permission"] || [];
    const permissionName = "android.permission.PACKAGE_USAGE_STATS";

    if (!permissions.some((permission) => permission.$?.["android:name"] === permissionName)) {
      permissions.push({ $: { "android:name": permissionName } });
    }

    manifest["uses-permission"] = permissions;
    return modConfig;
  });
};