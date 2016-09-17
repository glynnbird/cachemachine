module.exports = function(opts) {
  var client = require('request');
  var URL = require('url');
  var crypto = require('crypto');
  var paths = [];
  var cache = null;
  var debug = require('debug')('cachemachine');

  if (opts && opts.redis) {
    debug('Using Redis cache');
    cache = require('./lib/rediscache')(opts);
  } else {
    debug('Using in-memory cache');
    cache = require('./lib/inmemorycache')();
  }

  var addPath = function(p) {
    if (typeof p.path === 'string') {
      p.path = RegExp(p.path);
    } else if (!(p.path instanceof RegExp)) {
      throw ('path must be string or RegExp');
    }
    debug('Adding path', p.path.toString(), 'with ttl of', p.ttl, 'seconds');
    paths.push(p);
  };

  if (opts && opts.paths) {
    for(var i in opts.paths) {
      addPath(opts.paths[i]);
    }
  } else {
    // cache everything for one hour
    addPath({path: /.*/, ttl: 60*60});
  }

  var sha1 = function(string) {
    return crypto.createHash('sha1').update(string).digest('hex');
  };

  var calculateCacheHash = function(u, qs) {
    var str = qs ? JSON.stringify(qs) : '';
    return sha1(u + '?' + str);
  };

  var inScope = function(path) {
    for (var i in paths) {
      if (path.match(paths[i].path)) {
        return paths[i].ttl;
      }
    }
    return false;
  };

  var request = function(req, callback) {
    if (typeof req === 'string') {
      req = {
        method: 'get',
        url: req
      };
    }
    if (!req.method || req.method.toLowerCase() === 'get') {
      var parsed = URL.parse(req.url);
      var path = parsed.pathname;
      var ttl = inScope(path);
      debug(`TTL ${ttl}`);
      if (ttl) {
        var hash = calculateCacheHash(req.url, req.qs);
        cache.get(hash, function(err, data) {
          if (err || !data) {
            debug(`Cache Miss ${hash}`);
            client(req, function(e, r, b) {
              cache.put(hash, { e:e, r:r, b:b} , ttl, function() {
              });
              callback(e, r, b);
            });
          } else {
            debug(`Cache Hit ${hash}`);
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