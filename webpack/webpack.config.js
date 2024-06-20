const path = require('path')
const Dotenv = require('dotenv-webpack')

const resolveTsFile = (filename) =>
  path.resolve(__dirname, '..', 'src', `${filename}.ts`)

const resolveEnvFile = (env) => path.resolve(__dirname, '..', `.env.${env}`)

console.log('ENV', process.env.ENV)

module.exports = {
  mode: 'production',
  entry: {
    contentScript: resolveTsFile('contentScript'),
    browserAction: resolveTsFile('browserAction'),
    serviceWorker: resolveTsFile('serviceWorker'),
    netflixContentScript: resolveTsFile('netflix.contentScript'),
    netflix: resolveTsFile('netflix'),
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
  plugins: [
    new Dotenv({
      path: resolveEnvFile(process.env.ENV),
    }),
  ],
}
