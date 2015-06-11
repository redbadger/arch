require! {
  '../src/server'
  fs
  path
  bluebird
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
      inst.get app, {original-url: 'url', cookies:{}}, {}, paths: { public: 'dist' }
      # Test that the method that renders a route to a string has been called
      # with a URL an anonymous function.
      expect app.render .to-have-been-called-with { original-url: 'url', cookies:{} }, {}

    it "renders the into a provided layout" (done) !->
      inst.get app, {original-url: 'app-state', cookies:{}}, {}, paths: { layouts: support-templates, public: 'dist' }
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

  describe "form processing" (_) ->
    it "passes through to application's form-processing"

    it "renders into a provided layout"

    it "handles a redirect as a 302"

