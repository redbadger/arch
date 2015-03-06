#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var server;

try {
  var localServer = fs.statSync(path.join(path.resolve('.'), 'server.js'));
  if (localServer.isFile()) {
    server = require(path.join(path.resolve('.'), 'server.js'));
  }
}

catch (e) {
  server = require('../lib/server')().start();
}
