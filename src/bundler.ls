require! <[ webpack path webpack-dev-server fs deep-extend ]>
arch-webpack-config = require './webpack.config'

{Obj, keys} = require 'prelude-ls'

exports.bundle = (options, changed) ->
  base-conf = arch-webpack-config options
  user-conf = {}

  try
    user-conf = require path.join(options.app-path, 'webpack.config.js')

  config = deep-extend base-conf, user-conf

  # Optimise for production.
  if options.minify
    config.plugins.push new webpack.optimize.DedupePlugin!
    config.plugins.push new webpack.optimize.UglifyJsPlugin!

  # Enable HMR if watching.
  if options.watch
    config.entry.unshift 'webpack/hot/dev-server'
    config.entry.unshift 'webpack-dev-server/client?http://localhost:3001'
    config.output.public-path = 'http://localhost:3001/'
    config.module.loaders.push do
      test: /\.(?:js|jsx|ls)$/
      loader: 'react-hot'
      exclude: /node_modules/
    config.plugins.push new webpack.HotModuleReplacementPlugin!
    config.plugins.push new webpack.NoErrorsPlugin!

  # Initialise the bundle
  bundler = webpack config

  # Just bundle or watch + serve via webpack-dev-server
  if options.watch

    # Add a callback to server, passing changed files, to reload app code server-side.
    last-build = null
    bundler.plugin 'done', (stats) ->
      diff = stats.compilation.file-timestamps |> Obj.filter (> last-build) |> keys
      changed diff
      last-build := stats.end-time

    bundler.plugin 'error', (err) ->
      console.log err

    # Start the webpack dev server
    server = new webpack-dev-server bundler, do
      filename: 'app.js'
      content-base: path.join options.app-path, options.public
      hot: true # Enable hot loading
      quiet: true
      no-info: false
      watch-delay: 200
      headers:
        'Access-Control-Allow-Origin': '*'

    server.listen 3001, 'localhost'

  else if options.bundle
    # Run once if watch is false
    bundler.run (err, stats) ->
      console.log 'Bundled app.js'
  else
    console.warn "Built-in watch and bundle disabled. Compile your own client bundle!"