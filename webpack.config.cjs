const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = (env) => ({
  entry: path.resolve(__dirname, "src/browser/root-config"),
  output: {
    filename: "pmat-org-root-config.js",
    libraryTarget: "system",
    path: path.resolve(__dirname, "dist"),
    crossOriginLoading: "anonymous",
  },
  devtool: "source-map",
  module: {
    rules: [
      { parser: { system: false } },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{ loader: "babel-loader" }],
      },
    ],
  },
  devServer: {
    headers: {
      "access-control-allow-origin": "*",
    },
    historyApiFallback: true,
    allowedHosts: "all",
  },
  plugins: [new CleanWebpackPlugin()],
  externals: ["single-spa", /^@pmat-org\/.+$/],
});
