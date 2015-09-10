require! <[ xss-filters jade path ]>
require! { 'prelude-ls': 'prelude'}

map = prelude.Obj.map;

__template = jade.compile-file (path.join __dirname, 'index.jade')

exports.escape-state = -> xss-filters.inHTMLData it;

escape-filter = (k, v) -> if typeof v === 'string' then return exports.escape-state v else return v

exports.stringify-state = -> JSON.stringify it, escape-filter

exports.render-body = (meta, body, app-state, options) ->
  stringify-state = exports.stringify-state
  bundle-path = if options.environment is 'development' then "http://localhost:3001/app.js" else "/#{options.public}/app.js"
  arch-body = __template public: options.public, bundle: bundle-path, body: body, state: stringify-state app-state

  {layout, title} = meta
  layout body: arch-body, title: title
