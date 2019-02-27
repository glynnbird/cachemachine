const debug = require('debug')('cachemachine')

// an in-memory data store that doesn't use Redis
// for development only
module.exports = function () {
  // this is the data store
  var thecache = {}

  // calculate timestamp in seconds
  const timestamp = function () {
    return new Date().getTime() / 1000
  }

  // delete any cache keys that have expired
  // (garbage collection)
  const purge = function () {
    for (var i in thecache) {
      var now = timestamp()
      var obj = thecache[i]
      if (obj._ts <= now) {
        delete thecache[i]
      }
    }
  }

  // purge old keys every minute
  const interval = setInterval(purge, 1000 * 60)
  interval.unref()

  // put a new key/value pair in cache. 'value' is a JS object
  const put = function (key, value, ttl, callback) {
    debug('Setting key', key)
    thecache[key] = {
      value: value,
      _ts: timestamp() + ttl
    }
    callback(null, thecache[key])
  }

  // retrieve a key from cache
  const get = function (key, callback) {
    if (typeof thecache[key] !== 'undefined') {
      var now = timestamp()
      var ts = thecache[key]._ts

      if (ts >= now) {
        debug('Getting key', key)
        callback(null, thecache[key].value)
      } else {
        debug('Failed to get key', key)
        delete thecache[key]
        callback(null, null)
      }
    } else {
      debug('Failed to get key', key)
      callback(new Error('failed to get key'), null)
    }
  }

  // delete a key from cache
  const remove = function (key, callback) {
    delete thecache[key]
    callback(null, null)
  }

  // empty the cache
  const clearAll = function (callback) {
    thecache = {}
    callback(null, null)
  }

  // return cache stats
  const info = function (callback) {
    purge()
    const obj = {
      keys: Object.keys(thecache).length,
      memory: 0
    }
    return callback(null, obj)
  }

  return {
    get: get,
    put: put,
    remove: remove,
    clearAll: clearAll,
    info: info
  }
}
