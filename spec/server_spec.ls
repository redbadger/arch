require! {
  '../src/server'
  fs
  path
}

describe "server" (_) ->

  describe "template assignment" (_) ->

    var support-templates, app

    before-each !->

      support-templates := "#{__dirname}/support/fixtures"
      app := render: jasmine.create-spy 'spy' .and.call-fake (url, cbk) -> cbk 'app-state', 'body'

    it "calls the method that renders a route to string" !->

      server.handle-method-get app, 'url', support-templates
      # Test that the method that renders a route to a string has been called
      # with a URL an anonymous function.
      expect app.render .to-have-been-called-with 'url', jasmine.any(Function)

    it "throws an error if the specified template cannot be found" (done) !->

      var failed

      server.handle-method-get app, 'url', 'non-existent/path'
      .then (output) !->
        failed := false
      .catch (e) ->
        failed := true
      .finally ->
        expect failed .to-be true
        done!

    it "interpolates the instantiation partial with the author defined template" (done) !->

      server.handle-method-get app, 'app-state', support-templates
        .then (template) !->
          fs.read-file path.join(support-templates, 'default-reference.html'), (err, template-reference) !->
            expect template .to-equal template-reference.to-string!
            done!
