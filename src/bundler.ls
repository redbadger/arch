require! <[ webpack path webpack-dev-server fs deep-extend ]>
reflex-config = require './webpack.config'

{Obj, keys} = require 'prelude-ls'

exports.bundle = (options, on-change) ->
  config = reflex-config options

  # Deep-merge application config into reflex default config.
  try
    file = fs.stat-sync path.join(path.resolve(options.paths.app.abs), 'webpack.config.js')
    if file.is-file!
      app-config = require path.join(options.paths.app.abs, 'webpack.config.js')
      config := deep-extend config, app-config
  catch {message}
    console.error message

  # Initialise the bundle
  bundler = webpack config

  # Just bundle or watch + serve via webpack-dev-server
  if options.watch
    # Add a callback to server, passing changed files, to reload app code server-side.
    last-build = null
    bundler.plugin 'done', (stats) ->
      diff = stats.compilation.file-timestamps |> Obj.filter (> last-build) |> keys |> on-change
      last-build := stats.end-time

    bundler.plugin 'error', (err) ->
      console.log err

    # Start the webpack dev server
    server = new webpack-dev-server bundler, do
      filename: 'app.js'
      content-base: path.join options.paths.app.abs, options.paths.public
      hot: true # Enable hot loading
      quiet: !options.debug
      no-info: !options.debug
      watch-delay: 200

    server.listen options.webpack-port, 'localhost'

  else
    # Run once if watch is false
    bundler.run (err, stats) ->
      console.log 'Bundled app.js'