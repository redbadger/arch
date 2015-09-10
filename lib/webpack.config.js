(function(){
  var deepExtend, path, defaultConfig, webpack, config, entryPoint, appModules, archModules;
  deepExtend = require('deep-extend');
  path = require('path');
  defaultConfig = require('./default-config');
  webpack = require('webpack');
  config = defaultConfig();
  entryPoint = require.resolve(config.appPath);
  appModules = path.join(config.appPath, 'node_modules');
  archModules = path.join(config.archPath, 'node_modules');
  module.exports = function(severOptions){
    return {
      context: path.dirname(entryPoint),
      entry: ['./' + path.basename(entryPoint)],
      output: {
        libraryTarget: 'var',
        library: 'Application',
        path: path.join(config.appPath, config['public']),
        filename: 'app.js'
      },
      module: {
        loaders: [],
        postLoaders: [],
        preLoaders: [
          {
            test: /\.ls$/,
            loader: 'livescript-loader',
            exclude: /node_modules/
          }, {
            test: /\.(?:js|jsx)$/,
            loader: 'babel-loader',
            exclude: /node_modules/
          }
        ]
      },
      plugins: [new webpack.DefinePlugin({
        'process.env': JSON.stringify(deepExtend(process.env, {
          ARCH_ENV: 'browser'
        }))
      })],
      resolve: {
        root: appModules,
        fallback: archModules,
        extensions: ['', '.ls', '.js', '.jsx']
      },
      resolveLoader: {
        root: archModules,
        fallback: appModules
      }
    };
  };
}).call(this);
