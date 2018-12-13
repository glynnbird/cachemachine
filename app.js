'use strict';

module.exports = function (opts) {
  var client = require('request');
  var URL = require('url');
  var cache = null;
  var invalidate = false;
  var debug = require('debug')('cachemachine');
  var pathstore = require('./lib/pathstore.js')();
  var hash = require('./lib/hash.js');
  var extend = require('extend');
  var stream = require('stream');

  // choose Redis or in-memory cache
  if (opts && opts.redis) {
    debug('Using Redis cache');
    cache = require('./lib/rediscache')(opts);
  } else {
    debug('Using in-memory cache');
    cache = require('./lib/inmemorycache')();
  }

  // create a store of path regex/ttl pairs
  if (opts && opts.paths) {
    for(var i in opts.paths) {
      pathstore.add(opts.paths[i]);
    }
  } else {
    // or, cache everything for one hour
    pathstore.add({path: /.*/, ttl: 60*60});
  }

  // parses parameters to request
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

  // empty callback
  var nullcallback = function() { }

  // this is our replacement 'request' function
  var request = function(req, options, callback) {

    // create a pass-through stream in case the caller wishes
    // to pipe data using Node.js streams
    var s = new stream.PassThrough();

    // initialise parameters
    req = initParams(req, options, callback);
    callback = req.callback;
    if (!callback) {
      callback = nullcallback;
    }
    debug(req);

    invalidate = (req.method && req.method.toLowerCase() === 'invalidate');

    // only cache GET requests - implement invalidate
    if (!req.method || req.method.toLowerCase() === 'invalidate' ||
                          req.method.toLowerCase() === 'get') {
      var u = req.url || req.uri;
      if (!u) {
        throw('missing url/uri');
      }
      var parsed = URL.parse(u);
      var path = parsed.pathname;

      // check if path is one that is to be cached
      var ttl = pathstore.inScope(path);
      debug('TTL', ttl);
      if (ttl) {

        // calculate hash from the URL and the query string
        var h = hash.calculate(u, req.qs);

        // see if we have a cached value
        cache.get(h, function(err, data) {

          if (invalidate) {
            cache.remove(h, function(){});
            statusCode = 200;
            debug('Cache invalidated', h);
            callback(null, null, 'Cache invalidated');
          }

          // if not
          else if (err || !data) {

            // fetch using HTTP
            debug('Cache Miss', h);
            var statusCode = 500;
            client(req, function(e, r, b) {

              // only store successful GETs 
              if (!e && !b) {
                 cache.put(h, { e:e, r:r, b:b} , ttl, function() {});
              }

              callback(e, r, b);
            }).on('response', function(r) {
              statusCode = r && r.statusCode || 500;
            }).on('data', function(chunk) {
              if (statusCode < 500) {
                s.write(chunk);
              }
            }); 

          } else {

            // return cached value
            debug('Cache Hit', h);
            s.write(data.b);
            callback(data.e, data.r, data.b);
          }
        });
      } else {
        // if not a GET request to be cached
        client(req, callback).pipe(s);
      }
    } else {
      // if not a GET, just do the request
      debug('Other request', h);
      client(req, callback).pipe(s);
    }
    return s;
  };

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
