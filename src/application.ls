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
            React.create-element that.deref!, @props{state, context}
          else
            span "Page not found."

      # Create an instance of the root component element
      element: -> React.create-element @type, do
        component: @state.get 'component'
        context: @state.get 'context'
        state: @state.get 'state'

      # Mount the application to the root node
      mount: -> React.render @element!, @root

      # Common state loader/initialiser
      # Returns a promise with state.
      initialise: (path=(location.pathname + location.search + location.hash)) ->
        new bluebird (res, rej) ~>
          # Load initial state (env dependent)
          unless process.env.REFLEX_ENV is 'browser' and state = JSON.parse @root.get-attribute 'data-reflex-app-state'
            state = config.get-initial-state! or {}

          # Resolve routes before getting into async stuff..
          [component, context, route-init] = routes.resolve path, @_routes

          new bluebird (res, rej) -> (config.start or ((a, b) -> b a)) state, res
          .then (state) ->
            new bluebird (res, rej) -> (route-init or ((a, b) -> b a)) state, res
            .then (state)
              # And finally, send state and route data to be rendered/mounted/processed.
              res cursor {state, component, context}

      # clientside loader
      start: ->
        @initialise!
        .then (state) ~>
          @state = state

          # Initialise clientside routing
          routes.start @_routes, (component, context, init) ~>
            # When a route changes, update the state to reflect the new route
            @state.update (data) ->
              data.state = init data.state if init
              data import {component, context}

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
            console.log state
            return res [state.get 'state' .deref!, React.render-to-string @element!]

      # process a form from a particular route and render to string
      # returns a promise of [state, body, location]
      process-form: (path, post-data) ->
        new bluebird (res, rej) ~>
          initial-state = cursor config.get-initial-state!

          [route-component, context, route-init] = routes.resolve path, config.routes!
          root-element = React.create-element @type, initial-state: initial-state, component: route-component, context: context

        config.start initial-state, ->
            return res server-rendering.process-form root-element, initial-state, post-data, path unless route-init

            route-init initial-state, context, ->
              res server-rendering.process-form root-element, initial-state, post-data, path
