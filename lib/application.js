(function(){
  var bluebird, cursor, dom, routes, serverRendering, unescape, domUtils, span, appComponent, initAppState, observePageChange;
  bluebird = require('bluebird');
  cursor = require('./cursor');
  dom = require('./dom');
  routes = require('./routes');
  serverRendering = require('./server/server-rendering');
  unescape = require('lodash/string/unescape');
  domUtils = require('./virtual-dom-utils');
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
  initAppState = function(initialState, routeContext){
    return cursor({
      state: initialState,
      route: routeContext
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
  module.exports = {
    create: function(app){
      return {
        start: function(){
          var routeSet, path, rootDomNode, stateNode, serverState, appState, rootElement, root;
          routeSet = app.routes();
          path = location.pathname + location.search + location.hash;
          rootDomNode = document.getElementById("application");
          stateNode = document.getElementById("arch-state");
          serverState = JSON.parse(unescape(stateNode.text));
          appState = serverState
            ? cursor(serverState)
            : initAppState(app.getInitialState(), routes.resolve(routeSet, path));
          app.start(appState);
          rootElement = appComponent({
            appState: appState,
            routes: routeSet
          });
          root = React.render(rootElement, rootDomNode);
          appState.onChange(function(){
            return root.setState({
              appState: appState
            });
          });
          observePageChange(root, appState);
          return routes.start(app.routes(), appState);
        },
        render: function(path){
          var routeSet, appState, transaction, rootElement;
          routeSet = app.routes();
          appState = initAppState(app.getInitialState(), routes.resolve(routeSet, path));
          transaction = appState.startTransaction();
          app.start(appState);
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
        processForm: function(path, postData){
          var routeSet, appState, transaction, rootElement, location;
          routeSet = app.routes();
          appState = initAppState(app.getInitialState(), routes.resolve(routeSet, path));
          transaction = appState.startTransaction();
          app.start(appState);
          rootElement = appComponent({
            appState: appState,
            routes: routeSet
          });
          location = serverRendering.processForm(rootElement, appState, postData, path);
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
}).call(this);
