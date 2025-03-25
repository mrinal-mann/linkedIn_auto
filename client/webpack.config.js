const Dotenv = require("dotenv-webpack");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const outputPath = "dist";

const entryPoints = {
  main: path.resolve(__dirname, "src", "main.ts"),
  background: path.resolve(__dirname, "src", "background.ts"),
  popup: path.resolve(__dirname, "src", "popup", "index.ts"),
};

module.exports = {
  entry: entryPoints,
  output: {
    path: path.join(__dirname, outputPath),
    filename: "[name].js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(jpg|jpeg|png|gif|woff|woff2|eot|ttf|svg)$/i,
        use: "url-loader?limit=1024",
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: ".", to: ".", context: "public" },
        { from: "src/lib/types.ts", to: "lib/types.ts" },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src", "popup", "popup.html"),
      filename: "popup.html",
      chunks: ["popup"],
      inject: "body",
    }),
    new MiniCssExtractPlugin({
      filename: "styles/style.css",
    }),
    new Dotenv(),
  ],
};
