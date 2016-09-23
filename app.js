'use strict';

module.exports = function (opts) {
  var client = require('request');
  var URL = require('url');
  var cache = null;
  var debug = require('debug')('cachemachine');
  var pathstore = require('./lib/pathstore.js')();
  var hash = require('./lib/hash.js');
  var extend = require('extend');

  if (opts && opts.redis) {
    debug('Using Redis cache');
    cache = require('./lib/rediscache')(opts);
  } else {
    debug('Using in-memory cache');
    cache = require('./lib/inmemorycache')();
  }

  if (opts && opts.paths) {
    for(var i in opts.paths) {
      pathstore.add(opts.paths[i]);
    }
  } else {
    // cache everything for one hour
    pathstore.add({path: /.*/, ttl: 60*60});
  }

  function initParams(uri, options, callback) {
    if (typeof options === 'function') {
      callback = options
    }

    var params = {}
    if (typeof options === 'object') {
      extend(params, options, {uri: uri})
    } else if (typeof uri === 'string') {
      extend(params, {uri: uri})
    } else {
      extend(params, uri)
    }

    params.callback = callback || params.callback
    return params
  }

  var request = function(req, options, callback) {
    req = initParams(req, options, callback);
    callback = req.callback;
    if (!req.method || req.method.toLowerCase() === 'get') {
      var u = req.url || req.uri;
      if (!u) {
        throw('missing url/uri');
      }
      var parsed = URL.parse(u);
      var path = parsed.pathname;
      var ttl = pathstore.inScope(path);
      debug('TTL', ttl);
      if (ttl) {
        var h = hash.calculate(u, req.qs);
        cache.get(h, function(err, data) {
          if (err || !data) {
            debug('Cache Miss', h);
            client(req, function(e, r, b) {
              cache.put(h, { e:e, r:r, b:b} , ttl, function() {
              });
              callback(e, r, b);
            });
          } else {
            debug('Cache Hit', h);
            callback(data.e, data.r, data.b);
          }
        });
      } else {
        return client(req, callback);
      }
    }
  };

  function initParams(uri, options, callback) {
    if (typeof options === 'function') {
      callback = options
    }

    var params = {}
    if (typeof options === 'object') {
      extend(params, options, {uri: uri})
    } else if (typeof uri === 'string') {
      extend(params, {uri: uri})
    } else {
      extend(params, uri)
    }

    params.callback = callback || params.callback
    return params
  }


  function verbFunc (verb) {
    var method = verb.toUpperCase()
    return function (uri, options, callback) {
      var params = initParams(uri, options, callback)
      params.method = method
      return request(params, params.callback)
    }
  };

  request.get = verbFunc('get');
  request.head = verbFunc('head');
  request.post = verbFunc('post');
  request.put = verbFunc('put');
  request.patch = verbFunc('patch');
  request.del = verbFunc('delete');
  request['delete'] = verbFunc('delete');

  return request;
};