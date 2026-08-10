const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("cjs");
config.resolver.resolverMainFields = ["react-native", "module", "main"];
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
