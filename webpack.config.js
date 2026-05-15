const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { createOverridePlugin } = require("./webpack.overrides");

module.exports = {
  entry: "./src-client/app/Game/app.js",
  output: {
    path: path.resolve(__dirname, "dist/client"),
    filename: "asset/app.js",
    library: {
      name: "Game",
      type: "var",
    },
  },
  optimization: {
    minimize: false,
    moduleIds: "natural",
  },
  mode: "development",
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: require.resolve("./src-client/app/Game/app.js"),
        loader: "exports-loader",
        options: {
          type: "commonjs",
          exports: "single Game",
        },
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              url: false,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src-client/index.html",
      filename: "index.html",
      inject: false,
    }),
    new MiniCssExtractPlugin({
      filename: "asset/app.css",
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "src-client/image", to: "asset/image" },
        { from: "src-client/zombs_wasm.wasm", to: "asset/zombs_wasm.wasm" },
      ],
    }),
    createOverridePlugin(__dirname),
  ],
  target: "web",
  devServer: {
    port: 727,
    static: "./dist/client",
    liveReload: true,
    hot: false,
  },
};
