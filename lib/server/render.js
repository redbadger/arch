(function(){
  var xssFilters, jade, path, prelude, map, __template;
  xssFilters = require('xss-filters');
  jade = require('jade');
  path = require('path');
  prelude = require('prelude-ls');
  map = prelude.Obj.map;
  __template = jade.compileFile(path.join(__dirname, 'index.jade'));
  exports.stringifyState = function(it){
    return xssFilters.inHTMLData(
    JSON.stringify(
    it));
  };
  exports.renderBody = function(meta, body, appState, options){
    var bundlePath, archBody, layout, title;
    bundlePath = options.environment === 'development'
      ? "http://localhost:3001/app.js"
      : "/" + options.paths['public'] + "/app.js";
    archBody = __template({
      'public': options.paths['public'],
      bundle: bundlePath,
      body: body,
      state: exports.stringifyState(appState)
    });
    layout = meta.layout, title = meta.title;
    return layout({
      body: archBody,
      title: title
    });
  };
}).call(this);
