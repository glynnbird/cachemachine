const debug = require('debug')('cachemachine')
const { URL } = require('url')

// same method signature as 'inmemorycache.js' but uses Redis instead
module.exports = function (opt) {
  let password = null
  let hostname = null
  let port
  let connectionString
  let cert = null
  if (opt && opt.hostname) {
    password = (opt.password) || null
    hostname = (opt.hostname) || 'localhost'
    port = (opt.port) || 6379
    connectionString = 'redis:' + password + '//' + hostname + ':' + port
  } else if (opt && opt.connectionString) {
    connectionString = opt.connectionString
    cert = opt.cert
  } else {
    connectionString = 'redis://localhost:6379'
  }

  // setup Redis client
  debug('Connecting to Redis on', hostname, ':', port)
  const redis = require('redis')

  debug('Cert is ', cert)

  let client

  if (cert !== null) {
    let caCert = Buffer.from((cert), 'base64').toString()
    client = redis.createClient(connectionString, {
      tls: { ca: caCert,
        servername: new URL(connectionString).hostname }
    })
  } else {
    client = redis.createClient(connectionString)
  }

  const retval = {
    // put a key
    put: function (key, value, ttl, callback) {
      let val = JSON.stringify(value)
      client.setex(key, ttl, val, function (err) {
        if (!err) {
          debug('Setting key', key)
        }
        let val = { value: value, _ts: (new Date().getTime() / 1000) + ttl }
        return callback(err, val)
      })
    },

    // get a key
    get: function (key, callback) {
      client.get(key, function (err, data) {
        let rep = null
        if (!err && data !== null) {
          rep = JSON.parse(data)
          debug('Getting key', key)
        }

        if (err || rep === null) {
          debug('Failed to get key', key)
        }
        return callback((err || rep === null) ? new Error() : null, rep)
      })
    },

    // delete a key
    remove: function (key, callback) {
      client.del(key, function () {
        callback(null, null)
      })
    },

    // delete all keys
    clearAll: function (callback) {
      client.flushall(function () {
        callback(null, null)
      })
    },

    // get cache stats
    info: function (callback) {
      client.info(function (err, data) {
        let mem = data.match(/used_memory_human:[0-9A-Z.]{1,}/i)
        if (mem !== null) {
          mem = parseInt(mem[0].split(':')[1])
        } else {
          mem = '0K'
        }

        var keys = data.match(/keys=[0-9]{1,}/)
        if (keys !== null) {
          keys = parseInt(keys[0].split('=')[1])
        } else {
          keys = 0
        }

        return callback(err, {
          keys: keys,
          memory: mem
        })
      })
    }
  }

  return retval
}
