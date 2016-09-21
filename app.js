module.exports = function(opts) {
  var client = require('request');
  var URL = require('url');
  var cache = null;
  var debug = require('debug')('cachemachine');
  var pathstore = require('./lib/pathstore.js');
  var hash = require('./lib/hash.js');

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

  var request = function(req, callback) {
    if (typeof req === 'string') {
      req = {
        method: 'get',
        url: req
      };
    }
    if (!req.method || req.method.toLowerCase() === 'get') {
      var u = req.url || req.uri;
      if (!u) {
        throw('missing url/uri');
      }
      var parsed = URL.parse(u);
      var path = parsed.pathname;
      var ttl = pathstore.inScope(path);
      debug(`TTL ${ttl}`);
      if (ttl) {
        var h = hash.calculate(u, req.qs);
        cache.get(h, function(err, data) {
          if (err || !data) {
            debug(`Cache Miss ${h}`);
            client(req, function(e, r, b) {
              cache.put(h, { e:e, r:r, b:b} , ttl, function() {
              });
              callback(e, r, b);
            });
          } else {
            debug(`Cache Hit ${h}`);
            callback(data.e, data.r, data.b);
          }
        });
      } else {
        return client(req, callback);
      }
    }
  };



  return request;
};