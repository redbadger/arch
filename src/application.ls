require! <[ bluebird ./cursor ./dom ./routes ./server-rendering cookie ]>
require! './virtual-dom-utils': 'dom-utils'

{keys, each, Obj} = require 'prelude-ls'

{span} = dom

app-component = React.create-factory React.create-class do
  display-name: 'arch-application'

  get-initial-state: ->
    app-state: @props.app-state

  lookup-component: ->
    route = @state.app-state.get \route .deref!
    routes.get-component @props.routes, route.component-id

  render: ->
    component = @lookup-component!
    if component
      React.create-element that, app-state: @state.app-state
    else
      # FIXME make this user editable
      span "Page not found."

init-app-state = (initial-state, route-context, cookies) ->
  cursor state: initial-state, route: route-context, cookies: cookies

observe-page-change = (root-tree, app-state) ->
  app-state.get \route .on-change (route) ->
    # FIXME this is clearly a hack. We should figure out
    # how to do this when the rendering is done
    # which is after the set-state on the root component
    # is done.
    set-timeout ->
      {title} = dom-utils.route-metadata root-tree
      document.title = title
      if el = document.get-element-by-id route.hash
        # scroll to element if hash target and hash target found
        window.scroll-to 0, (el.get-bounding-client-rect!.top - document.body.get-bounding-client-rect!.top)
      else
        # scroll to top if no hash target or not found
        window.scroll-to 0, 0
    , 0

parse-req-cookies = (cookies) ->
  cookies |> Obj.map -> value: it

module.exports =
  # define an application instance
  create: (app) ->
    do
      # start the application on the client
      start: ->
        route-set = app.routes!
        path = (location.pathname + location.search + location.hash)
        client-cookies = parse-req-cookies cookie.parse(document.cookie)

        root-dom-node = document.get-element-by-id "application"

        # Initialise app state

        state-node = document.get-element-by-id "arch-state"
        server-state = JSON.parse state-node.text

        app-state = if server-state
          cursor server-state
        else
          init-app-state app.get-initial-state!, routes.resolve(route-set, pathname), client-cookies

        # Boot the app

        app.start app-state

        # Mount the root component

        root-element = app-component app-state: app-state, routes: route-set
        root = React.render root-element, root-dom-node

        # Whenever app state changes re-render

        app-state.get 'cookies' .on-change (cookies) ->
          cookies |> keys |> each (k) ->
            c = if cookies[k] then cookies[k].value else cookies[k]
            unless (client-cookies[k] && client-cookies[k].value === JSON.stringify c)
              if (c is null or c is undefined)
                document.cookie = cookie.serialize k, null, {expires: (new Date())}
              else
                document.cookie = cookie.serialize k, c, cookies[k].options

        app-state.on-change -> root.set-state app-state: app-state

        # Set up SPA navigation

        observe-page-change root, app-state
        routes.start app.routes!, app-state

      # render a particular route to string
      # returns a promise of [state, body]
      render: (req, res) ->
        path = req.original-url
        route-set = app.routes!
        client-cookies = parse-req-cookies req.cookies
        app-state = init-app-state app.get-initial-state!, null, client-cookies

        transaction = app-state.start-transaction!

        # send new cookies if they are modified during transaction

        app-state.get 'cookies' .on-change (cookies) ->
          cookies |> keys |> each (k) ->
            c = if cookies[k] then cookies[k].value else cookies[k]
            unless (client-cookies[k] && client-cookies[k].value === JSON.stringify c)
              if (c is null or c is undefined)
                res.clear-cookie k
              else
                res.cookie k, c, cookies[k].options

        # Boot the app

        app.start app-state
        app-state.get 'route' .update -> routes.resolve(route-set, path)
        root-element = app-component app-state: app-state, routes: route-set

        app-state.end-transaction transaction
        .then ->
          meta = server-rendering.route-metadata root-element, app-state
          [meta, app-state.deref!, React.render-to-string root-element]

      # process a form from a particular route and render to string
      # returns a promise of [state, body, location]
      process-form: (req, res) ->
        path = req.original-url

        client-cookies = parse-req-cookies req.cookies

        route-set = app.routes!
        app-state = init-app-state app.get-initial-state!, null, client-cookies

        app-state.get 'cookies' .on-change (cookies) ->
          cookies |> keys |> each (k) ->
            c = if cookies[k] then cookies[k].value else cookies[k]
            unless (client-cookies[k] && client-cookies[k].value === JSON.stringify c)
              if (c is null or c is undefined)
                res.clear-cookie k
              else
                res.cookie k, c, cookies[k].options

        transaction = app-state.start-transaction!

        # Boot the app

        app.start app-state
        app-state.get 'route' .update -> routes.resolve(route-set, path)
        root-element = app-component app-state: app-state, routes: route-set

        # Process the form

        location = server-rendering.process-form root-element, app-state, req.body, path

        app-state.end-transaction transaction
        .then ->
          meta = server-rendering.route-metadata root-element, app-state
          body = unless location then React.render-to-string root-element else null

          [meta, app-state.deref!, body, location]

