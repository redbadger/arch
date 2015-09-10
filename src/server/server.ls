require! <[
  express path
  bluebird body-parser
  ../bundler livescript babel/register
  ../default-config deep-extend
]>

{ render-body } = require './render'

{ each, values, filter, find, flatten, map, first } = require 'prelude-ls'

module.exports = (server-options) ->
  default-options = default-config! # These defaults already have env overwrites applied to them. See default-config.
  options = deep-extend default-options, server-options

  app = require options.app-path

  get = (req, res) ->
    console.log "GET", req.original-url
    arch-get app, req.original-url, options
    .spread (status, headers, body) ->
      res
        .set 'Content-Type': 'text/html; charset=utf-8'
        .status status
        .set headers
        .send body

  post = (req, res) ->
    console.log "POST", req.original-url, req.body
    arch-post app, req.original-url, req.body, options
    .spread (status, headers, body) ->
      res
        .set 'Content-Type': 'text/html; charset=utf-8'
        .status status
        .set headers
        .send body

  start: (cb) ->
    server = express!
    .use "/#{options.public}", express.static path.join(options.app-path, options.public)
    .use body-parser.urlencoded extended: false
    .get '*', get
    .post '*', post

    # Bundle before server starts accepting requests.
    # .bundle takes a boolean of whether to watch and can take a callback which
    # allows you to hook into any watch changes.

    bundler.bundle options, (ids) ->
      done = []
      while id = first ids
        parents = require.cache |> values |> filter (-> !(it.id in done) and it.children |> find (.id is id)) |> flatten |> map (.id)
        done.push id
        parents |> each -> ids.push it
        ids.splice 0, 1

      done |> each -> delete require.cache[it]

      try
        app := require options.app-path
      catch
        console.error 'Error in changed files when restarting server'

    if cb
      listener = server.listen options.port, (err) ->
        console.log 'App is listening on', listener.address!.port
        cb err, { server: server, listener: listener }
    else
      new bluebird (res, rej) ->
        listener = server.listen options.port, ->
          console.log 'App is listening on', listener.address!.port
          res server: server, listener: listener

  /* test-exports */
  get: arch-get
  post: arch-post
  /* end-test-exports */

arch-get = (app, url, options) ->
  app.render url
  .spread (meta, app-state, body) ->
    html = render-body meta, body, app-state, options
    [200, {}, html]

arch-post = (app, url, post-data, options) ->
  app.process-form url, post-data
  .spread (meta, app-state, body, location) ->
    # FIXME build a full URL for location to comply with HTTP
    return [302, 'Location': location, ""] unless body

    html = render-body meta, body, app-state, options
    [200, {}, html]
