const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /node_modules\/react-native\/ReactAndroid\/.*/,
  /node_modules\/.*\/ios\/.*/,
  /android\/app\/build\/.*/,
  /node_modules\/.*\/android\/build\/.*/,
];

module.exports = config;
