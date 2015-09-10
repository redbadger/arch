(function(){
  var path, fs, ref$, filter, map, first, join, keys, parsers, parser, fpathRegex, filterConfigs, merge, initialConf, config, defaultConfig;
  path = require('path');
  fs = require('fs');
  ref$ = require('prelude-ls'), filter = ref$.filter, map = ref$.map, first = ref$.first, join = ref$.join, keys = ref$.keys;
  /* Map of parsers which take a file path and parse functions*/
  parsers = {
    js: function(it){
      return require(it);
    },
    ls: function(it){
      return require(it);
    }
  };
  parser = function(fname){
    return parsers[path.extname(fname).slice(1)](fname);
  };
  fpathRegex = new RegExp("arch.config.(?:" + join('|')(
  keys(
  parsers)) + ")$");
  filterConfigs = function(it){
    return fpathRegex.test(it);
  };
  merge = function(x, xs){
    return import$(x, xs);
  };
  initialConf = {
    appPath: process.env.arch_app_path || path.resolve('.'),
    archPath: process.env.arch_arch_path || path.dirname(require.resolve('../package.json')),
    bundle: process.env.arch_bundle || true,
    debug: process.env.arch_debug || false,
    environment: process.env.arch_environment || process.env.NODE_ENV || 'development',
    minify: process.env.arch_minify || process.env.NODE_ENV === 'production',
    'public': process.env.arch_public || 'dist',
    port: process.env.ARCH_PORT || process.env.arch_port || 3000,
    watch: process.env.arch_watch || process.env.NODE_ENV !== 'production'
  };
  config = null;
  defaultConfig = function(){
    var files, confFiles, config;
    if (config) {
      return config;
    }
    files = fs.readdirSync(path.dirname('.'));
    confFiles = filter(filterConfigs, map(function(it){
      return path.resolve('.', it);
    }, files));
    if (confFiles.length > 1) {
      console.error('Multiple configs found. Please have one arch.config.ls or arch.config.js');
      config = initialConf;
    } else if (deepEq$(confFiles.length, 1, '===')) {
      config = merge(initialConf, parser(first(confFiles)));
    } else {
      config = initialConf;
    }
    return config;
  };
  defaultConfig.parsers = parsers;
  module.exports = defaultConfig;
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  function deepEq$(x, y, type){
    var toString = {}.toString, hasOwnProperty = {}.hasOwnProperty,
        has = function (obj, key) { return hasOwnProperty.call(obj, key); };
    var first = true;
    return eq(x, y, []);
    function eq(a, b, stack) {
      var className, length, size, result, alength, blength, r, key, ref, sizeB;
      if (a == null || b == null) { return a === b; }
      if (a.__placeholder__ || b.__placeholder__) { return true; }
      if (a === b) { return a !== 0 || 1 / a == 1 / b; }
      className = toString.call(a);
      if (toString.call(b) != className) { return false; }
      switch (className) {
        case '[object String]': return a == String(b);
        case '[object Number]':
          return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
        case '[object Date]':
        case '[object Boolean]':
          return +a == +b;
        case '[object RegExp]':
          return a.source == b.source &&
                 a.global == b.global &&
                 a.multiline == b.multiline &&
                 a.ignoreCase == b.ignoreCase;
      }
      if (typeof a != 'object' || typeof b != 'object') { return false; }
      length = stack.length;
      while (length--) { if (stack[length] == a) { return true; } }
      stack.push(a);
      size = 0;
      result = true;
      if (className == '[object Array]') {
        alength = a.length;
        blength = b.length;
        if (first) {
          switch (type) {
          case '===': result = alength === blength; break;
          case '<==': result = alength <= blength; break;
          case '<<=': result = alength < blength; break;
          }
          size = alength;
          first = false;
        } else {
          result = alength === blength;
          size = alength;
        }
        if (result) {
          while (size--) {
            if (!(result = size in a == size in b && eq(a[size], b[size], stack))){ break; }
          }
        }
      } else {
        if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) {
          return false;
        }
        for (key in a) {
          if (has(a, key)) {
            size++;
            if (!(result = has(b, key) && eq(a[key], b[key], stack))) { break; }
          }
        }
        if (result) {
          sizeB = 0;
          for (key in b) {
            if (has(b, key)) { ++sizeB; }
          }
          if (first) {
            if (type === '<<=') {
              result = size < sizeB;
            } else if (type === '<==') {
              result = size <= sizeB
            } else {
              result = size === sizeB;
            }
          } else {
            first = false;
            result = size === sizeB;
          }
        }
      }
      stack.pop();
      return result;
    }
  }
}).call(this);
