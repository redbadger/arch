require! <[ path webpack ]>
{Obj} = require 'prelude-ls'

# Basic configuration
config = (options) ->
  paths = options.paths
  watch = options.watch
  entry = require.resolve options.paths.app.rel

  browser-env = ^^process.env
  browser-env.REFLEX_ENV = 'browser'
  browser-env = browser-env |> Obj.map JSON.stringify

  conf =
    entry: [ './' + path.basename entry ]

    context: path.dirname entry

    output:
      library-target: 'var'
      library: 'Application'
      path: path.join paths.app.abs, paths.public
      filename: 'app.js'

    resolve:
      root: path.join paths.app.abs, 'node_modules'
      fallback: path.join paths.reflex.abs, 'node_modules'
      extensions: [ '', '.js', '.jsx' ]

    resolve-loader:
      root: path.join paths.reflex.abs, 'node_modules'
      fallback: path.join paths.app.abs, 'node_modules'

    plugins: [ new webpack.DefinePlugin 'process.env': browser-env ]

    module:
      pre-loaders: []
      loaders: []
      post-loaders: []

  # Optimise for production.
  if options.environment is 'production'
    conf.plugins.push new webpack.optimize.DedupePlugin!
    conf.plugins.push new webpack.optimize.UglifyJsPlugin!

  # Enable HMR if watching.
  if options.watch
    conf.entry.unshift 'webpack/hot/dev-server'
    conf.entry.unshift 'webpack-dev-server/client?http://localhost:3001'
    conf.output.public-path = 'http://localhost:3001/'
    conf.module.loaders.push do
      test: /\.(?:js|jsx)$/
      loader: 'react-hot'
      exclude: /node_modules/
    conf.plugins.push new webpack.HotModuleReplacementPlugin!
    conf.plugins.push new webpack.NoErrorsPlugin!

  return conf


module.exports = config