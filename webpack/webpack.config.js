const path = require('path')

const resolve = (filename) =>
  path.resolve(__dirname, '..', 'src', `${filename}.ts`)

module.exports = {
  mode: 'production',
  entry: {
    contentScript: resolve('contentScript'),
    browserAction: resolve('browserAction'),
    serviceWorker: resolve('serviceWorker'),
  },
  output: {
    path: path.join(__dirname, '../dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
}
