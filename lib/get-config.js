(function(){
  var rc, defaultConfig, deepExtend;
  rc = require('rc');
  defaultConfig = require('./default-config');
  deepExtend = require('deep-extend');
  module.exports = function(opts){
    opts == null && (opts = {});
    return rc('arch', deepExtend(defaultConfig, opts));
  };
}).call(this);
