(function(){
  var express, fs, path, jade, bluebird, bodyParser, bundler, ref$, each, values, filter, find, flatten, map, first, __template, readFile, defaults, reflexGet, reflexPost, reflexInterp, layoutRender;
  express = require('express');
  fs = require('fs');
  path = require('path');
  jade = require('jade');
  bluebird = require('bluebird');
  bodyParser = require('body-parser');
  bundler = require('./bundler');
  ref$ = require('prelude-ls'), each = ref$.each, values = ref$.values, filter = ref$.filter, find = ref$.find, flatten = ref$.flatten, map = ref$.map, first = ref$.first;
  __template = jade.compileFile(path.join(__dirname, 'index.jade'));
  readFile = bluebird.promisify(fs.readFile);
  defaults = {
    dependencies: [],
    environment: process.env.NODE_ENV || 'development',
    port: 3000,
    paths: {
      app: {
        abs: path.resolve('.'),
        rel: path.relative(__dirname, path.resolve('.'))
      },
      layouts: 'app/layouts',
      reflex: {
        abs: path.dirname(require.resolve("../package.json")),
        rel: path.relative(path.resolve('.'), path.dirname(require.resolve("../package.json")))
      },
      'public': 'dist'
    }
  };
  module.exports = function(options){
    var app, get, post;
    options == null && (options = {});
    options = import$(defaults, options);
    each(require)(
    options.dependencies);
    app = options.app || require(options.paths.app.rel);
    get = function(req, res){
      console.log("GET ", req.originalUrl);
      return reflexGet(app, req.originalUrl, options).then(function(it){
        return res.send(it);
      });
    };
    post = function(req, res){
      var postData;
      postData = req.body;
      console.log("POST ", req.originalUrl, postData);
      return reflexPost(app, req.originalUrl, postData, options).spread(function(status, headers, body){
        console.log(status + "", headers);
        return res.status(status).set(headers).send(body);
      });
    };
    return {
      start: function(cb){
        var server, listener;
        server = express().use("/" + options.paths['public'], express['static'](path.join(options.paths.app.abs, options.paths['public']))).use(bodyParser.urlencoded({
          extended: false
        })).get('*', get).post('*', post);
        bundler.bundle(options.paths, options.environment === 'development', function(ids){
          var done, id, parents;
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
          return app = require(options.paths.app.rel);
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
  reflexGet = function(app, url, options){
    return app.render(url).spread(function(appState, body){
      return layoutRender(path.join(options.paths.layouts, 'default.html'), body, appState, options);
    });
  };
  reflexPost = function(app, url, postData, options){
    return app.processForm(url, postData).spread(function(appState, body, location){
      if (body) {
        return layoutRender(path.join(options.paths.layouts, 'default.html'), body, appState, options).then(function(it){
          return [200, {}, it];
        });
      } else {
        return bluebird.resolve([
          302, {
            'Location': location
          }, ""
        ]);
      }
    });
  };
  reflexInterp = function(template, body){
    return template.toString().replace('{reflex-body}', body);
  };
  layoutRender = function(path, body, appState, options){
    return readFile(path).then(function(template){
      var bundlePath;
      bundlePath = options.environment === 'development'
        ? "http://localhost:3001/app.js"
        : "/" + options.paths['public'] + "/app.js";
      return reflexInterp(template, __template({
        'public': options.paths['public'],
        bundle: bundlePath,
        body: body,
        state: appState
      }));
    }).error(function(){
      throw new Error('Template not found');
    });
  };
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
}).call(this);
