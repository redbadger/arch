require!  <[ ../src/default-config bluebird path fs sinon ]>

describe "config" (_) ->
  describe "loading" (_) ->
    sandbox = sinon.sandbox.create!

    after-each -> sandbox.restore!

    it "shows an error when multiple configs are found" ->
      sandbox
        .stub fs, 'readdirSync'
        .returns [
          "arch.config.js",
          "arch.config.ls"
        ]

      sandbox.stub console, 'error'

      default-config!

      expect console.error.called-with "Multiple configs found. Please have one arch.config.ls or arch.config.js" .to-be true

    it "merges the config with the initial config when one is found" ->
      sandbox
        .stub fs, 'readdirSync'
        .returns [
          "arch.config.js"
        ]

      sandbox
        .stub default-config.parsers, "js"
        .returns port: 12345

      conf = default-config!

      expect conf.port .to-be 12345
