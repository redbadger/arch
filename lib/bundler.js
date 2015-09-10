(function(){
  var webpack, path, webpackDevServer, fs, deepExtend, archWebpackConfig, ref$, Obj, keys;
  webpack = require('webpack');
  path = require('path');
  webpackDevServer = require('webpack-dev-server');
  fs = require('fs');
  deepExtend = require('deep-extend');
  archWebpackConfig = require('./webpack.config');
  ref$ = require('prelude-ls'), Obj = ref$.Obj, keys = ref$.keys;
  exports.bundle = function(options, changed){
    var baseConf, userConf, config, bundler, lastBuild, server;
    baseConf = archWebpackConfig(options);
    userConf = {};
    try {
      userConf = require(path.join(options.appPath, 'webpack.config.js'));
    } catch (e$) {}
    config = deepExtend(baseConf, userConf);
    if (options.minify) {
      config.plugins.push(new webpack.optimize.DedupePlugin());
      config.plugins.push(new webpack.optimize.UglifyJsPlugin());
    }
    if (options.watch) {
      config.entry.unshift('webpack/hot/dev-server');
      config.entry.unshift('webpack-dev-server/client?http://localhost:3001');
      config.output.publicPath = 'http://localhost:3001/';
      config.module.loaders.push({
        test: /\.(?:js|jsx|ls)$/,
        loader: 'react-hot',
        exclude: /node_modules/
      });
      config.plugins.push(new webpack.HotModuleReplacementPlugin());
      config.plugins.push(new webpack.NoErrorsPlugin());
    }
    bundler = webpack(config);
    if (options.watch) {
      lastBuild = null;
      bundler.plugin('done', function(stats){
        var diff;
        diff = keys(
        Obj.filter((function(it){
          return it > lastBuild;
        }))(
        stats.compilation.fileTimestamps));
        changed(diff);
        return lastBuild = stats.endTime;
      });
      bundler.plugin('error', function(err){
        return console.log(err);
      });
      server = new webpackDevServer(bundler, {
        filename: 'app.js',
        contentBase: path.join(options.appPath, options['public']),
        hot: true,
        quiet: true,
        noInfo: false,
        watchDelay: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
      return server.listen(3001, 'localhost');
    } else if (options.bundle) {
      return bundler.run(function(err, stats){
        return console.log('Bundled app.js');
      });
    } else {
      return console.warn("Built-in watch and bundle disabled. Compile your own client bundle!");
    }
  };
}).call(this);
