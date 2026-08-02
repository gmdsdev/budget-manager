const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// The workspace packages ship raw TypeScript from `src/`, so Metro has to watch the
// repo root and resolve from the hoisted store as well as the app's own node_modules.
//
// Hierarchical lookup stays **on**, unlike the usual monorepo recipe: bun installs
// isolated, so a package's own dependencies live in a nested `node_modules` beside it,
// and disabling the walk makes Metro fail to resolve them (`babel-preset-expo` from
// `expo`, `whatwg-fetch` from `@expo/metro-runtime`, and so on down the tree).
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// The logo is the web app's own artwork, imported as components rather than
// re-drawn: `assetExts` has to give the extension up before `sourceExts` can
// claim it, or Metro treats an `.svg` as an image and hands back a URI.
config.transformer.babelTransformerPath = require.resolve(
  "react-native-svg-transformer/expo",
);
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg",
);
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

module.exports = config;
