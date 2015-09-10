require! {
  '../src/server'
  fs
  path
  bluebird
  '../src/server/render'
}

describe "server" (_) ->
  describe "layout rendering" (_) ->
    var app, inst, support-templates

    before-each !->
      meta =
        layout: -> "Test #it test"
        title: 'Hello'

      support-templates := "#{__dirname}/support/fixtures"
      app := render: jasmine.create-spy 'spy' .and.call-fake (url) -> bluebird.resolve [meta, 'app-state', 'body']
      inst := server app: app

    it "passes through to application's server rendering" !->
      inst.get app, 'url', paths: { public: 'dist' }
      # Test that the method that renders a route to a string has been called
      # with a URL an anonymous function.
      expect app.render .to-have-been-called-with 'url'

    it "renders the into a provided layout" (done) !->
      inst.get app, 'app-state', paths: { layouts: support-templates, public: 'dist' }
      .spread (status, headers, body) ->
        expect body .to-match /^Test /
        expect body .to-match /\ test$/
        done!

    it "throws an error if a component returns an empty layout" (done) !->
      meta =
        layout: "Test #it test"
        title: 'Hello'

      bad-app = render: jasmine.create-spy 'spy' .and.call-fake (url) -> bluebird.resolve [meta, 'app-state', 'body']

      var failed
      inst.get bad-app, 'url'
      .then (output) !->
        failed := false
      .catch (e) ->
        failed := true
      .finally ->
        expect failed .to-be true
        done!

    describe "dumping state" (_) ->
      it "stringifies and escapes state when rendering" !->
        meta =
          layout: -> "Test #{it.body} test"
          title: 'Hello'

        spy-on render, 'stringifyState' .and.call-through!
        output = render.render-body meta, 'body', { unsafe: '</script><script>alert("xss")</script>' }, paths: { layouts: support-templates, public: 'dist' }
        expect render.stringify-state .to-have-been-called!

      it "stringifies state to JSON" ->
        state = { a: true, b: false };
        stringify = -> JSON.parse (render.stringify-state state)
        expect stringify .not.to-throw!

      it "escapes injected script tags" ->
        state = '</script><script>alert("hi")</script>'
        expect (render.stringify-state state) .not.to-match /^\<\/script>/

  describe "form processing" (_) ->
    it "passes through to application's form-processing"

    it "renders into a provided layout"

    it "handles a redirect as a 302"
