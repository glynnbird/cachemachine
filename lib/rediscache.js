'use strict';

var debug = require('debug')('cachemachine');
var {URL} = require('url');

// same method signature as 'inmemorycache.js' but uses Redis instead
module.exports = function(opt) {

  let password = null, hostname = null, port, connectionString, cert = null;
  if (opt && opt.hostname) {
    password = (opt.password) || null;
    hostname = (opt.hostname) || 'localhost';
    port = (credentials.port) || 6379;
    connectionString = "redis:" + password + "//" + hostname + ":" + port;
  } else if (opt && opt.connectionString) {
    connectionString =  opt.connectionString;
    cert =  opt.cert;
  } else {
    connectionString = "redis://localhost:6379";
  }

  // setup Redis client
  debug('Connecting to Redis on', hostname, ':', port);
  var redis = require('redis');

  debug('Cert is ', cert);

  let tls = null;
  var client;

  if (cert !== null) {
    let caCert = new Buffer.from((cert), 'base64').toString();
    client = redis.createClient(connectionString, {
       tls: { ca: caCert,
            servername: new URL(connectionString).hostname }
      });
  }
  else {
    client = redis.createClient(connectionString);
  }
      
  var retval =  {
    // put a key    
    put: function(key, value, ttl, callback) {
      var val = JSON.stringify(value);
      client.setex(key, ttl, val, function(err) {

        if (!err) {
          debug('Setting key', key);
        }
        var val = { value: value, _ts: (new Date().getTime()/1000) + ttl };
        return callback(err, val);
      });
    },
    
    // get a key
    get: function(key, callback) {
      
      client.get(key, function(err, data) {
        var rep = null;
        if (!err && data !== null) {
          rep = JSON.parse(data);
          debug('Getting key', key);
        }
        
        if (err || rep === null) {
          debug('Failed to get key', key);
        }
        return callback( (err || rep === null) ? true : null , rep);
      });
    },
    
    // delete a key
    remove: function(key, callback) {
      client.del(key, function() {
        callback(null, null);
      });
    },
    
    // delete all keys
    clearAll: function(callback) {
      client.flushall(function() {
        callback(null, null);
      });
    },
    
    // get cache stats
    info: function(callback) {
      client.info(function(err, data) {

        var mem = data.match(/used_memory_human:[0-9A-Z\.]{1,}/i);
        if (mem !== null) {
          mem = parseInt(mem[0].split(":")[1]);
        } else {
          mem = "0K";
        }

        var keys = data.match(/keys=[0-9]{1,}/);
        if (keys !== null) {
          keys = parseInt(keys[0].split("=")[1]);
        } else {
          keys = 0;
        }

        return callback(err, {
          keys: keys,
          memory: mem
        });

      });
    }
  
  };
  
  return retval;
  
};
