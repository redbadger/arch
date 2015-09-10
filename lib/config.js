(function(){
  var rc, defaultConfig;
  rc = require('rc');
  defaultConfig = require('./default-config');
  module.exports = rc('arch', defaultConfig);
}).call(this);
