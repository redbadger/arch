(function(){
  var path, paths;
  path = require('path');
  paths = {
    app: {
      abs: path.resolve('.'),
      rel: path.relative(__dirname, path.resolve('.'))
    },
    arch: {
      abs: path.dirname(require.resolve("../package.json")),
      rel: path.relative(path.resolve('.'), path.dirname(require.resolve("../package.json")))
    }
  };
  module.exports = paths;
}).call(this);
