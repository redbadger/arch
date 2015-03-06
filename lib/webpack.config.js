(function(){
  var path, webpack, Obj, config;
  path = require('path');
  webpack = require('webpack');
  Obj = require('prelude-ls').Obj;
  config = function(options){
    var paths, watch, entry, browserEnv, conf;
    paths = options.paths;
    watch = options.watch;
    entry = require.resolve(options.paths.app.rel);
    browserEnv = clone$(process.env);
    browserEnv.REFLEX_ENV = 'browser';
    browserEnv = Obj.map(JSON.stringify)(
    browserEnv);
    conf = {
      entry: ['./' + path.basename(entry)],
      context: path.dirname(entry),
      output: {
        libraryTarget: 'var',
        library: 'Application',
        path: path.join(paths.app.abs, paths['public']),
        filename: 'app.js'
      },
      resolve: {
        root: path.join(paths.app.abs, 'node_modules'),
        fallback: path.join(paths.reflex.abs, 'node_modules'),
        extensions: ['', '.js', '.jsx']
      },
      resolveLoader: {
        root: path.join(paths.reflex.abs, 'node_modules'),
        fallback: path.join(paths.app.abs, 'node_modules')
      },
      plugins: [new webpack.DefinePlugin({
        'process.env': browserEnv
      })],
      module: {
        preLoaders: [],
        loaders: [],
        postLoaders: []
      }
    };
    if (options.environment === 'production') {
      conf.plugins.push(new webpack.optimize.DedupePlugin());
      conf.plugins.push(new webpack.optimize.UglifyJsPlugin());
    }
    if (options.watch) {
      conf.entry.unshift('webpack/hot/dev-server');
      conf.entry.unshift('webpack-dev-server/client?http://localhost:3001');
      conf.output.publicPath = 'http://localhost:3001/';
      conf.module.loaders.push({
        test: /\.(?:js|jsx)$/,
        loader: 'react-hot',
        exclude: /node_modules/
      });
      conf.plugins.push(new webpack.HotModuleReplacementPlugin());
      conf.plugins.push(new webpack.NoErrorsPlugin());
    }
    return conf;
  };
  module.exports = config;
  function clone$(it){
    function fun(){} fun.prototype = it;
    return new fun;
  }
}).call(this);
