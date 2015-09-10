require! {
  'deep-extend'
  path
  './default-config'
  webpack
}

config = default-config!

entry-point = require.resolve config.app-path
app-modules = path.join config.app-path, 'node_modules'
arch-modules = path.join config.arch-path, 'node_modules'

module.exports = (sever-options) ->
  context: path.dirname entry-point
  entry: [ './' + path.basename entry-point ]
  output:
    library-target: 'var'
    library: 'Application'
    path: path.join config.app-path, config.public
    filename: 'app.js'
  module:
    loaders: []
    post-loaders: []
    pre-loaders:
      * test: /\.ls$/
        loader: 'livescript-loader'
        exclude: /node_modules/
      * test: /\.(?:js|jsx)$/
        loader: 'babel-loader'
        exclude: /node_modules/
  plugins: [ new webpack.DefinePlugin('process.env': JSON.stringify(deep-extend process.env, ARCH_ENV: 'browser')) ]
  resolve:
    root: app-modules
    fallback: arch-modules
    extensions: [ '', '.ls', '.js', '.jsx' ]
  resolveLoader:
    root: arch-modules
    fallback: app-modules
