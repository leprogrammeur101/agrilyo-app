// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", {
        // Option recommandée pour SDK 56
        jsxImportSource: "react"
      }]
    ],
    plugins: [
      // Important : le plugin Reanimated DOIT être en dernier
      "react-native-reanimated/plugin",
    ],
  };
};