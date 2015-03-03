require! <[ bluebird ./routes ./cursor ./dom ./server-rendering ]>

{span} = dom

module.exports =
  # define an application instance
  create: (config) ->
    do
      state: null # Our state cursor holder
      _routes: config.routes! # A reference to our parsed routes.

      # Allow definition of a different mount point.
      root: if process.env.REFLEX_ENV is 'browser' => (config.root or document.get-element-by-id 'application' or document.body) else => void

      # Root component layout
      type: React.create-class do
        display-name: 'reflex-application'

        render: ->
          if @props.component then
            React.create-element that.deref!, @props{app-state, context}
          else
            span "Page not found."

      # Create an instance of the root component element
      element: (state = @state) -> React.create-element @type, do
        component: state.get 'component'
        context: state.get 'context'
        app-state: state.get 'appState'

      # Mount the application to the root node
      mount: -> React.render @element!, @root

      # Common state loader/initialiser
      # Returns a promise with state.
      initialise: (path=(location.pathname + location.search + location.hash)) ->
        new bluebird (res, rej) ~>
          # Load initial state (env dependent)
          unless process.env.REFLEX_ENV is 'browser' and app-state = JSON.parse @root.get-attribute 'data-reflex-app-state'
            app-state = config.get-initial-state! or {}

          # Resolve routes before getting into async stuff..
          [component, context, route-init] = routes.resolve path, @_routes

          new bluebird (res, rej) ->
            # Run app initialiser if it exists (asynchronously)
            if config.start then config.start app-state, res else res app-state
          .then (app-state) ->
            # Then run route initialiser if it exists (asynchronously)
            new bluebird (res, rej) ->
              if route-init then route-init app-state, res else res app-state
            .then (app-state) ->
              # And finally, send state and route data to be rendered/mounted/processed.
              res cursor {app-state, component, context}

      # clientside loader
      start: ->
        @initialise!
        .then (state) ~>
          @state = state
          # Initialise clientside routing
          routes.start @_routes, (component, context, init) ~>
            # When a route changes, update the state to reflect the new route
            new bluebird (res, rej) ~>
              state = @state.get 'appState' .deref!
              if init then init state, res else res state
            .then (app-state) ~>
              @state.update (data) ->
                data import {app-state, component, context}

          # Tell application to rerender on state change.
          @state.on-change ~>
            @mount!

          # Then mount once clientside!
          @mount!

      # render a particular route to string
      # returns a promise of [state, body]
      render: (path) ->
        new bluebird (res, rej) ~>
          @initialise path
          .then (state) ~>
            return res [state.get 'appState' .deref!, React.render-to-string @element state]

      # process a form from a particular route and render to string
      # returns a promise of [state, body, location]
      process-form: (path, post-data) ->
        new bluebird (res, rej) ~>
          @initialise path
          .then (state) ~>
          @state = state
          res server-rendering.process-form @element!, state, post-data, path
