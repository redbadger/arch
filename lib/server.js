(function(){
  var express, fs, path, jade, bluebird, bodyParser, bundler, LiveScript, register, cookieParser, ref$, each, values, filter, find, flatten, map, first, defaults, archGet, archPost, __template, layoutRender;
  express = require('express');
  fs = require('fs');
  path = require('path');
  jade = require('jade');
  bluebird = require('bluebird');
  bodyParser = require('body-parser');
  bundler = require('./bundler');
  LiveScript = require('LiveScript');
  register = require('babel/register');
  cookieParser = require('cookie-parser');
  ref$ = require('prelude-ls'), each = ref$.each, values = ref$.values, filter = ref$.filter, find = ref$.find, flatten = ref$.flatten, map = ref$.map, first = ref$.first;
  defaults = {
    environment: process.env.NODE_ENV || 'development',
    port: 3000,
    paths: {
      app: {
        abs: path.resolve('.'),
        rel: path.relative(__dirname, path.resolve('.'))
      },
      arch: {
        abs: path.dirname(require.resolve("../package.json")),
        rel: path.relative(path.resolve('.'), path.dirname(require.resolve("../package.json")))
      },
      'public': 'dist'
    }
  };
  module.exports = function(options){
    var app, get, post;
    options = import$(clone$(defaults), options);
    app = options.app || require(options.paths.app.rel);
    get = function(req, res){
      console.log("GET", req.originalUrl);
      return archGet(app, req, res, options).spread(function(status, headers, body){
        return res.status(status).set(headers).send(body);
      });
    };
    post = function(req, res){
      console.log("POST", req.originalUrl, req.body);
      return archPost(app, req, res, options).spread(function(status, headers, body){
        return res.status(status).set(headers).send(body);
      });
    };
    return {
      start: function(cb){
        var server, listener;
        server = express().use("/" + options.paths['public'], express['static'](path.join(options.paths.app.abs, options.paths['public']))).use(bodyParser.urlencoded({
          extended: false
        })).use(cookieParser()).get('*', get).post('*', post);
        bundler.bundle(options.paths, options.environment === 'development', function(ids){
          var done, id, parents, e;
          done = [];
          while (id = first(ids)) {
            parents = map(fn$)(
            flatten(
            filter(fn1$)(
            values(
            require.cache))));
            done.push(id);
            each(fn2$)(
            parents);
            ids.splice(0, 1);
          }
          each(function(it){
            var ref$, ref1$;
            return ref1$ = (ref$ = require.cache)[it], delete ref$[it], ref1$;
          })(
          done);
          try {
            return app = require(options.paths.app.rel);
          } catch (e$) {
            e = e$;
            return console.error('Error in changed files when restarting server');
          }
          function fn$(it){
            return it.id;
          }
          function fn1$(it){
            return find(function(it){
              return it.id === id;
            })(
            !in$(it.id, done) && it.children);
          }
          function fn2$(it){
            return ids.push(it);
          }
        });
        if (cb) {
          return listener = server.listen(options.port, function(err){
            console.log('App is listening on', listener.address().port);
            return cb(err, {
              server: server,
              listener: listener
            });
          });
        } else {
          return new bluebird(function(res, rej){
            var listener;
            return listener = server.listen(options.port, function(){
              console.log('App is listening on', listener.address().port);
              return res({
                server: server,
                listener: listener
              });
            });
          });
        }
      }
    };
  };
  archGet = function(app, req, res, options){
    return app.render(req, res).spread(function(meta, appState, body){
      var html;
      html = layoutRender(meta, body, appState, options);
      return [200, {}, html];
    });
  };
  archPost = function(app, req, res, options){
    return app.processForm(req, res).spread(function(meta, appState, body, location){
      var html;
      if (!body) {
        return [
          302, {
            'Location': location
          }, ""
        ];
      }
      html = layoutRender(meta, body, appState, options);
      return [200, {}, html];
    });
  };
  __template = jade.compileFile(path.join(__dirname, 'index.jade'));
  layoutRender = function(meta, body, appState, options){
    var bundlePath, archBody, layout, title;
    bundlePath = options.environment === 'development'
      ? "http://localhost:3001/app.js"
      : "/" + options.paths['public'] + "/app.js";
    archBody = __template({
      'public': options.paths['public'],
      bundle: bundlePath,
      body: body,
      state: appState
    });
    layout = meta.layout, title = meta.title;
    return layout({
      body: archBody,
      title: title
    });
  };
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  function clone$(it){
    function fun(){} fun.prototype = it;
    return new fun;
  }
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
}).call(this);
