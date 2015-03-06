(function(){
  var webpack, path, webpackDevServer, fs, deepExtend, reflexConfig, ref$, Obj, keys;
  webpack = require('webpack');
  path = require('path');
  webpackDevServer = require('webpack-dev-server');
  fs = require('fs');
  deepExtend = require('deep-extend');
  reflexConfig = require('./webpack.config');
  ref$ = require('prelude-ls'), Obj = ref$.Obj, keys = ref$.keys;
  exports.bundle = function(options, onChange){
    var config, file, appConfig, bundler, lastBuild, server;
    config = reflexConfig(options);
    try {
      file = fs.statSync(path.join(path.resolve(options.paths.app.abs), 'webpack.config.js'));
      if (file.isFile()) {
        appConfig = require(path.join(options.paths.app.abs, 'webpack.config.js'));
        config = deepExtend(config, appConfig);
      }
    } catch (e$) {}
    bundler = webpack(config);
    if (options.watch) {
      lastBuild = null;
      bundler.plugin('done', function(stats){
        var diff;
        diff = onChange(
        keys(
        Obj.filter((function(it){
          return it > lastBuild;
        }))(
        stats.compilation.fileTimestamps)));
        return lastBuild = stats.endTime;
      });
      bundler.plugin('error', function(err){
        return console.log(err);
      });
      server = new webpackDevServer(bundler, {
        filename: 'app.js',
        contentBase: path.join(options.paths.app.abs, options.paths['public']),
        hot: true,
        quiet: !options.debug,
        noInfo: !options.debug,
        watchDelay: 200
      });
      return server.listen(options.webpackPort, 'localhost');
    } else {
      return bundler.run(function(err, stats){
        return console.log('Bundled app.js');
      });
    }
  };
}).call(this);
