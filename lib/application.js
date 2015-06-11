(function(){
  var bluebird, cursor, dom, routes, serverRendering, cookie, domUtils, ref$, keys, each, Obj, span, appComponent, initAppState, observePageChange, parseReqCookies;
  bluebird = require('bluebird');
  cursor = require('./cursor');
  dom = require('./dom');
  routes = require('./routes');
  serverRendering = require('./server-rendering');
  cookie = require('cookie');
  domUtils = require('./virtual-dom-utils');
  ref$ = require('prelude-ls'), keys = ref$.keys, each = ref$.each, Obj = ref$.Obj;
  span = dom.span;
  appComponent = React.createFactory(React.createClass({
    displayName: 'arch-application',
    getInitialState: function(){
      return {
        appState: this.props.appState
      };
    },
    lookupComponent: function(){
      var route;
      route = this.state.appState.get('route').deref();
      return routes.getComponent(this.props.routes, route.componentId);
    },
    render: function(){
      var component, that;
      component = this.lookupComponent();
      if (that = component) {
        return React.createElement(that, {
          appState: this.state.appState
        });
      } else {
        return span("Page not found.");
      }
    }
  }));
  initAppState = function(initialState, routeContext, cookies){
    return cursor({
      state: initialState,
      route: routeContext,
      cookies: cookies
    });
  };
  observePageChange = function(rootTree, appState){
    return appState.get('route').onChange(function(route){
      return setTimeout(function(){
        var title, el;
        title = domUtils.routeMetadata(rootTree).title;
        document.title = title;
        if (el = document.getElementById(route.hash)) {
          return window.scrollTo(0, el.getBoundingClientRect().top - document.body.getBoundingClientRect().top);
        } else {
          return window.scrollTo(0, 0);
        }
      }, 0);
    });
  };
  parseReqCookies = function(cookies){
    return Obj.map(function(it){
      return {
        value: it
      };
    })(
    cookies);
  };
  module.exports = {
    create: function(app){
      return {
        start: function(){
          var routeSet, path, clientCookies, rootDomNode, stateNode, serverState, appState, rootElement, root;
          routeSet = app.routes();
          path = location.pathname + location.search + location.hash;
          clientCookies = parseReqCookies(cookie.parse(document.cookie));
          rootDomNode = document.getElementById("application");
          stateNode = document.getElementById("arch-state");
          serverState = JSON.parse(stateNode.text);
          appState = serverState
            ? cursor(serverState)
            : initAppState(app.getInitialState(), routes.resolve(routeSet, pathname), clientCookies);
          app.start(appState);
          rootElement = appComponent({
            appState: appState,
            routes: routeSet
          });
          root = React.render(rootElement, rootDomNode);
          appState.get('cookies').onChange(function(cookies){
            return each(function(k){
              var c;
              c = cookies[k]
                ? cookies[k].value
                : cookies[k];
              if (!(clientCookies[k] && deepEq$(clientCookies[k].value, JSON.stringify(c), '==='))) {
                if (c === null || c === undefined) {
                  return document.cookie = cookie.serialize(k, null, {
                    expires: new Date()
                  });
                } else {
                  return document.cookie = cookie.serialize(k, c, cookies[k].options);
                }
              }
            })(
            keys(
            cookies));
          });
          appState.onChange(function(){
            return root.setState({
              appState: appState
            });
          });
          observePageChange(root, appState);
          return routes.start(app.routes(), appState);
        },
        render: function(req, res){
          var path, routeSet, clientCookies, appState, transaction, rootElement;
          path = req.originalUrl;
          routeSet = app.routes();
          clientCookies = parseReqCookies(req.cookies);
          appState = initAppState(app.getInitialState(), null, clientCookies);
          transaction = appState.startTransaction();
          appState.get('cookies').onChange(function(cookies){
            return each(function(k){
              var c;
              c = cookies[k]
                ? cookies[k].value
                : cookies[k];
              if (!(clientCookies[k] && deepEq$(clientCookies[k].value, JSON.stringify(c), '==='))) {
                if (c === null || c === undefined) {
                  return res.clearCookie(k);
                } else {
                  return res.cookie(k, c, cookies[k].options);
                }
              }
            })(
            keys(
            cookies));
          });
          app.start(appState);
          appState.get('route').update(function(){
            return routes.resolve(routeSet, path);
          });
          rootElement = appComponent({
            appState: appState,
            routes: routeSet
          });
          return appState.endTransaction(transaction).then(function(){
            var meta;
            meta = serverRendering.routeMetadata(rootElement, appState);
            return [meta, appState.deref(), React.renderToString(rootElement)];
          });
        },
        processForm: function(req, res){
          var path, clientCookies, routeSet, appState, transaction, rootElement, location;
          path = req.originalUrl;
          clientCookies = parseReqCookies(req.cookies);
          routeSet = app.routes();
          appState = initAppState(app.getInitialState(), null, clientCookies);
          appState.get('cookies').onChange(function(cookies){
            return each(function(k){
              var c;
              c = cookies[k]
                ? cookies[k].value
                : cookies[k];
              if (!(clientCookies[k] && deepEq$(clientCookies[k].value, JSON.stringify(c), '==='))) {
                if (c === null || c === undefined) {
                  return res.clearCookie(k);
                } else {
                  return res.cookie(k, c, cookies[k].options);
                }
              }
            })(
            keys(
            cookies));
          });
          transaction = appState.startTransaction();
          app.start(appState);
          appState.get('route').update(function(){
            return routes.resolve(routeSet, path);
          });
          rootElement = appComponent({
            appState: appState,
            routes: routeSet
          });
          location = serverRendering.processForm(rootElement, appState, req.body, path);
          return appState.endTransaction(transaction).then(function(){
            var meta, body;
            meta = serverRendering.routeMetadata(rootElement, appState);
            body = !location ? React.renderToString(rootElement) : null;
            return [meta, appState.deref(), body, location];
          });
        }
      };
    }
  };
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
