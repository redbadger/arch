require! <[ xss-filters jade path ]>
require! { 'prelude-ls': 'prelude'}

map = prelude.Obj.map;

__template = jade.compile-file (path.join __dirname, 'index.jade')

exports.stringify-state = -> it |> JSON.stringify |> xss-filters.inHTMLData

exports.render-body = (meta, body, app-state, options) ->
  bundle-path = if options.environment is 'development' then "http://localhost:3001/app.js" else "/#{options.paths.public}/app.js"
  arch-body = __template public: options.paths.public, bundle: bundle-path, body: body, state: exports.stringify-state app-state

  {layout, title} = meta
  layout body: arch-body, title: title
