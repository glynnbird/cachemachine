

module.exports = function(opts) {
  var client = require('request');
  var URL = require('url');
  var crypto = require('crypto');
  var paths = [];
  var cache = null;
  var debug = require('debug')('cachemachine');

  if (opts) {
    debug('Using Redis cache');
    cache = require('./lib/rediscache')(opts);
  } else {
    debug('Using in-memory cache');
    cache = require('./lib/inmemorycache')();
  }

  var sha1 = function(string) {
    return crypto.createHash('sha1').update(string).digest('hex');
  };

  var calculateCacheHash = function(u, qs) {
    var str = qs ? JSON.stringify(qs) : '';
    return sha1(u + '?' + str);
  }

  var request = function() {
    return function(req, callback) {
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
              client(req, function(e, h, b) {
                cache.put(hash, { e:e, h:h, b:b} , ttl, function() {
                });
                callback(e, h, b);
              });
            } else {
              debug(`Cache Hit ${hash}`);
              callback(data.e, data.h, data.b);
            }
          });
        } else {
          return client(req, callback);
        }
      }
    }
  };


  var inScope = function(path) {
    for (var i in paths) {
      if (path.match(paths[i].path)) {
        return paths[i].ttl;
      }
    }
    return false;
  }

  var addPath = function(regexp, ttl) {
    if (typeof regexp === 'string') {
      regexp = RegExp(regexp);
    } else if (!(regexp instanceof RegExp)) {
      throw ('first parameter must be string or RegExp');
    }
    var p = {
      path: regexp,
      ttl: ttl
    };
    debug('Adding path', regexp.toString(), 'with ttl of', ttl, 'seconds');
    paths.push(p);
  };

  return {
    request: request,
    addPath: addPath
  }
};