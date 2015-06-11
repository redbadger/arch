(function(){
  var testUtils, ref$, filter, find, any, extractRoute, formElements, routeMetadata, toString$ = {}.toString;
  testUtils = React.addons.TestUtils;
  ref$ = require('prelude-ls'), filter = ref$.filter, find = ref$.find, any = ref$.any;
  extractRoute = function(tree){
    var routes;
    routes = testUtils.findAllInRenderedTree(tree, function(it){
      return it.getLayoutTemplate && toString$.call(it.getLayoutTemplate).slice(8, -1) === 'Function';
    });
    return routes[0];
  };
  formElements = function(tree, path, inputNames){
    var forms, inputs, form;
    forms = testUtils.findAllInRenderedTree(tree, function(it){
      return it.tagName === 'FORM';
    });
    inputs = [];
    form = find(function(form){
      inputs = testUtils.findAllInRenderedTree(form, function(it){
        var ref$;
        return (ref$ = it.tagName) === 'INPUT' || ref$ === 'TEXTAREA' || ref$ === 'SELECT';
      });
      return any(function(it){
        return in$(it.props.name, inputNames);
      })(
      inputs);
    })(
    filter(function(it){
      return it.props.action === path;
    })(
    forms));
    return [form, inputs];
  };
  routeMetadata = function(tree){
    var route, title, that;
    route = extractRoute(tree);
    title = (that = route.getTitle) ? that.call(route) : "";
    return {
      title: title,
      layout: route.getLayoutTemplate()
    };
  };
  module.exports = {
    routeMetadata: routeMetadata,
    formElements: formElements
  };
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
}).call(this);
