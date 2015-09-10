require! <[ path fs ]>

{ filter, map, first, join, keys } = require 'prelude-ls'

# RC automatically overwrites these with env variables.
# For example to edit environment set arch_environment

/* Map of parsers which take a file path and parse functions*/

parsers =
  js: -> require it,
  ls: -> require it

parser = (fname) -> parsers[(path.extname fname).slice(1)](fname)

fpath-regex = new RegExp "arch\.config\.(?:#{parsers |> keys |> join '|'})$"

filter-configs = -> fpath-regex.test it

merge = (x, xs) -> x import xs

initial-conf =
  app-path:     process.env.arch_app_path or path.resolve '.'
  arch-path:    process.env.arch_arch_path or path.dirname require.resolve '../package.json'
  bundle:       process.env.arch_bundle or true
  debug:        process.env.arch_debug or false
  environment:  process.env.arch_environment or process.env.NODE_ENV or 'development'
  minify:       process.env.arch_minify or process.env.NODE_ENV is 'production'
  public:       process.env.arch_public or 'dist'
  port:         process.env.ARCH_PORT or process.env.arch_port or 3000 # TODO: Deprecate ARCH_PORT (caps) in future (use another convention)
  watch:        process.env.arch_watch or process.env.NODE_ENV isnt 'production'

config = null

default-config = ->
  return config if config

  files = fs.readdir-sync (path.dirname '.')
  conf-files = (filter filter-configs, map((-> path.resolve '.', it), files))

  if conf-files.length > 1
    console.error 'Multiple configs found. Please have one arch.config.ls or arch.config.js'
    config = initial-conf
  else if conf-files.length === 1
    config = merge initial-conf, parser(first conf-files)
  else
    config = initial-conf

  return config

default-config.parsers = parsers

module.exports = default-config
