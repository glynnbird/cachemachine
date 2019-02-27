module.exports = function (opts) {
  const client = require('request')
  const URL = require('url')
  const debug = require('debug')('cachemachine')
  const pathstore = require('./lib/pathstore.js')()
  const hash = require('./lib/hash.js')
  const extend = require('extend')
  const stream = require('stream')
  var cache = null
  var invalidate = false

  // choose Redis or in-memory cache
  if (opts && opts.redis) {
    debug('Using Redis cache')
    cache = require('./lib/rediscache')(opts)
  } else {
    debug('Using in-memory cache')
    cache = require('./lib/inmemorycache')()
  }

  // create a store of path regex/ttl pairs
  if (opts && opts.paths) {
    for (var i in opts.paths) {
      pathstore.add(opts.paths[i])
    }
  } else {
    // or, cache everything for one hour
    pathstore.add({ path: /.*/, ttl: 60 * 60 })
  }

  // parses parameters to request
  const initParams = function (uri, options, callback) {
    if (typeof options === 'function') {
      callback = options
    }

    var params = {}
    if (typeof options === 'object') {
      extend(params, options, { uri: uri })
    } else if (typeof uri === 'string') {
      extend(params, { uri: uri })
    } else {
      extend(params, uri)
    }

    params.callback = callback || params.callback
    return params
  }

  // empty callback
  const nullcallback = function () { }

  // this is our replacement 'request' function
  const request = function (req, options, callback) {
    // create a pass-through stream in case the caller wishes
    // to pipe data using Node.js streams
    const s = new stream.PassThrough()

    // initialise parameters
    req = initParams(req, options, callback)
    callback = req.callback
    if (!callback) {
      callback = nullcallback
    }
    debug(req)

    invalidate = (req.method && req.method.toLowerCase() === 'invalidate')

    // only cache GET requests - implement invalidate
    if (!req.method || req.method.toLowerCase() === 'invalidate' ||
                          req.method.toLowerCase() === 'get') {
      const u = req.url || req.uri
      if (!u) {
        throw (new Error('missing url/uri'))
      }
      const parsed = URL.parse(u)
      const path = parsed.pathname
      let statusCode

      // check if path is one that is to be cached
      const ttl = pathstore.inScope(path)
      debug('TTL', ttl)
      if (ttl) {
        // calculate hash from the URL and the query string
        const h = hash.calculate(u, req.qs)

        // see if we have a cached value
        cache.get(h, function (err, data) {
          if (invalidate) {
            cache.remove(h, function () {
              // do nothing
            })
            statusCode = 200
            debug('Cache invalidated', h)
            callback(null, null, 'Cache invalidated')
          } else if (err || !data) {
            // fetch using HTTP
            debug('Cache Miss', h)
            statusCode = 500
            client(req, function (e, r, b) {
              // only store successful GETs
              if (!e) {
                cache.put(h, { e: e, r: r, b: b }, ttl, function () {})
              }

              callback(e, r, b)
            }).on('response', function (r) {
              statusCode = (r && r.statusCode) ? r.statusCode : 500
            }).on('data', function (chunk) {
              if (statusCode < 500) {
                s.write(chunk)
              }
            })
          } else {
            // return cached value
            debug('Cache Hit', h)
            const str = JSON.stringify(data.b)
            s.write(str)
            callback(data.e, data.r, data.b)
          }
        })
      } else {
        // if not a GET request to be cached
        client(req, callback).pipe(s)
      }
    } else {
      // if not a GET, just do the request
      debug('Other request', req)
      client(req, callback).pipe(s)
    }
    return s
  }

  const verbFunc = function (verb) {
    var method = verb.toUpperCase()
    return function (uri, options, callback) {
      var params = initParams(uri, options, callback)
      params.method = method
      return request(params, params.callback)
    }
  }

  request.get = verbFunc('get')
  request.head = verbFunc('head')
  request.post = verbFunc('post')
  request.put = verbFunc('put')
  request.patch = verbFunc('patch')
  request.del = verbFunc('delete')
  request['delete'] = verbFunc('delete')

  return request
}
